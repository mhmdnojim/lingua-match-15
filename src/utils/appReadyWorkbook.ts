import * as XLSX from 'xlsx';

/**
 * Reader for the "App-Ready" HSK workbook schema (Schema Version 4.x).
 *
 * Structure:
 *   <Level>        one row per word, incl. a permanent "Word ID"
 *   Sense Map      Word ID + Sense ID -> Chinese / Pinyin / English sense
 *   Reverse Index  one row per (Word ID, Sense ID, Language) with Card Label,
 *                  Main Entry, Latin, Is Canonical, Playable, Sense Assignment Status
 *   Review Queue / Sources / App Schema — metadata, not consumed by the game
 *
 * Semantic model (this is the important part):
 *   Word  ->  Sense  ->  Language entries
 *
 * A playable vocabulary item is a SENSE, not a spreadsheet row and never a
 * comma-separated fragment. Therefore:
 *   - one flat row per Sense ID (different senses of 白 become separate items)
 *   - within a sense, the Is Canonical entry is the card text; the remaining
 *     language entries follow as alternatives (the meanings panel exposes them,
 *     the canonical one stays selected by default)
 *   - entries that are not Playable, not Assigned, or sit on the S00 catch-all
 *     sense are skipped so review material never enters normal rounds
 *   - Card Label is the card text; Main Entry keeps the long lexical text
 *   - the Latin column feeds the transliteration shown above the word
 */

export interface FlatSheet {
  headers: string[];
  rows: Record<string, string>[];
}

const yes = (v: unknown) => String(v ?? '').trim().toLowerCase() === 'yes';
const str = (v: unknown) => String(v ?? '').trim();

export function isAppReadyWorkbook(workbook: XLSX.WorkBook): boolean {
  const names = workbook.SheetNames;
  return names.includes('Reverse Index') && (names.includes('Sense Map') || names.includes('App Schema'));
}

function sheetRows(workbook: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

const pick = (row: Record<string, unknown>, test: (key: string) => boolean) => {
  const key = Object.keys(row).find(k => test(k.toLowerCase().trim()));
  return key ? str(row[key]) : '';
};

/** A sense is usable in normal gameplay only when it is a real, reviewed sense */
const isCatchAllSense = (senseId: string) => /-S0*0$/i.test(senseId);

const isAssigned = (row: Record<string, unknown>) => {
  const status = pick(row, k => k === 'sense assignment status' || k === 'assignment status');
  // Missing column = older sheet: treat as assigned, Playable still gates it.
  return !status || status.toLowerCase() === 'assigned';
};

/** Flatten an app-ready workbook into headers + one row per SENSE. Returns null when it isn't one. */
export function readAppReadyWorkbook(workbook: XLSX.WorkBook): FlatSheet | null {
  if (!isAppReadyWorkbook(workbook)) return null;

  const reverse = sheetRows(workbook, 'Reverse Index');
  if (reverse.length === 0) return null;

  const senses = sheetRows(workbook, 'Sense Map');
  const vocabSheetName = workbook.SheetNames.find(
    n => !['Sources', 'Sense Map', 'Reverse Index', 'Review Queue', 'App Schema'].includes(n),
  );
  const vocab = vocabSheetName ? sheetRows(workbook, vocabSheetName) : [];

  // --- word-level base data (Word ID -> Chinese / Pinyin) and word order ------
  const wordOrder: string[] = [];
  const words = new Map<string, { chinese: string; pinyin: string }>();

  vocab.forEach(row => {
    const id = pick(row, k => k === 'word id');
    if (!id || words.has(id)) return;
    wordOrder.push(id);
    words.set(id, {
      chinese: pick(row, k => k === 'chinese' || k.startsWith('chinese |') || k.startsWith('chinese|')),
      pinyin: pick(row, k => k === 'pinyin'),
    });
  });

  // --- sense-level base data --------------------------------------------------
  type Sense = { senseId: string; wordId: string; chinese: string; pinyin: string; gloss: string };
  const senseOrder: string[] = [];
  const senseById = new Map<string, Sense>();

  const addSense = (senseId: string, wordId: string, chinese: string, pinyin: string, gloss: string) => {
    if (!senseId || isCatchAllSense(senseId)) return;
    const existing = senseById.get(senseId);
    if (existing) {
      if (!existing.chinese) existing.chinese = chinese;
      if (!existing.pinyin) existing.pinyin = pinyin;
      if (!existing.gloss) existing.gloss = gloss;
      return;
    }
    if (!words.has(wordId)) {
      wordOrder.push(wordId);
      words.set(wordId, { chinese, pinyin });
    }
    senseOrder.push(senseId);
    senseById.set(senseId, { senseId, wordId, chinese, pinyin, gloss });
  };

  senses.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const wordId = pick(row, k => k === 'word id') || senseId.replace(/-S\d+$/i, '');
    const word = words.get(wordId);
    addSense(
      senseId,
      wordId,
      pick(row, k => k === 'chinese' || k.startsWith('chinese |')) || word?.chinese || '',
      pick(row, k => k === 'pinyin') || word?.pinyin || '',
      pick(row, k => k === 'english sense' || k === 'sense gloss' || k === 'gloss' || k === 'sense'),
    );
  });

  // Senses referenced only by the Reverse Index still count.
  reverse.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    if (!senseId || senseById.has(senseId)) return;
    const wordId = pick(row, k => k === 'word id') || senseId.replace(/-S\d+$/i, '');
    const word = words.get(wordId);
    addSense(senseId, wordId, word?.chinese || '', word?.pinyin || '', '');
  });

  if (senseOrder.length === 0) return null;

  // --- language entries per sense --------------------------------------------
  type Entry = { label: string; latin: string; canonical: boolean };
  const languages: string[] = [];
  const hasLatin = new Set<string>();
  const bySense = new Map<string, Map<string, Entry[]>>();

  reverse.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const language = pick(row, k => k === 'language');
    const label = pick(row, k => k === 'card label') || pick(row, k => k === 'main entry');
    if (!senseId || !language || !label || !senseById.has(senseId)) return;

    // Only reviewed, playable entries feed normal gameplay.
    if (!yes(row['Playable']) || !isAssigned(row)) return;

    if (!languages.includes(language)) languages.push(language);

    const canonical = yes(row['Is Canonical']);
    let perLang = bySense.get(senseId);
    if (!perLang) bySense.set(senseId, (perLang = new Map()));
    const list = perLang.get(language) ?? [];
    if (!list.some(e => e.label === label)) {
      const latin = pick(row, k => k === 'latin');
      const keepLatin = latin && language.toLowerCase() !== 'english';
      if (keepLatin) hasLatin.add(language);
      list.push({ label, latin: keepLatin ? latin : '', canonical });
    }
    perLang.set(language, list);
  });

  // --- build the flat rows: one per sense --------------------------------------
  const headers = ['Chinese | 中文', 'Pinyin'];
  languages.forEach(language => {
    headers.push(language);
    if (hasLatin.has(language)) headers.push(`${language} Latin`);
  });

  const orderedSenses = senseOrder
    .map(id => senseById.get(id)!)
    .sort((a, b) => wordOrder.indexOf(a.wordId) - wordOrder.indexOf(b.wordId) || a.senseId.localeCompare(b.senseId));

  const rows: Record<string, string>[] = orderedSenses
    .map(sense => {
      const row: Record<string, string> = {
        // The sense is the semantic identity of a playable item.
        'Word ID': sense.senseId,
        'Sense ID': sense.senseId,
        'Vocab Word ID': sense.wordId,
        'Chinese | 中文': sense.chinese,
        Pinyin: sense.pinyin,
      };
      const perLang = bySense.get(sense.senseId);
      languages.forEach(language => {
        // Canonical entry first: it becomes the card text, the rest stay as
        // same-sense alternatives inside the meanings panel.
        const entries = [...(perLang?.get(language) ?? [])].sort(
          (a, b) => Number(b.canonical) - Number(a.canonical),
        );
        row[language] = entries.map(e => e.label).join(', ');
        if (hasLatin.has(language)) {
          const latin = entries.map(e => e.latin);
          row[`${language} Latin`] = latin.every(Boolean) ? latin.join(', ') : latin.find(Boolean) ?? '';
        }
      });
      return row;
    })
    .filter(row => row['Chinese | 中文'] || languages.some(l => row[l]));

  return rows.length ? { headers, rows } : null;
}
