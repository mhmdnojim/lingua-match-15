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
  if (names.includes('App Vocabulary')) return true;
  return names.includes('Reverse Index') && (names.includes('Sense Map') || names.includes('App Schema'));
}

/**
 * Schema 7.x "Ultra-Lean Wide Matrix":
 *   App Vocabulary  one row per Sense ID, one column per language (+ "<Lang> Latin")
 *   Card Labels     Sense ID + Language -> Card Label (+ Disambiguation)
 *   Alternatives    Sense ID + Language -> Alternative Entry (+ Latin)
 *
 * Sense ID — never Word ID — is the identity of a playable line, so two senses of
 * the same word stay two separate lines and never merge their translations.
 */
const WIDE_META = new Set([
  'sense id',
  'word id',
  'entry id',
  'playable',
  'verified',
  'coverage status',
  'worst confidence',
  'review languages',
  'notes',
  'source',
]);

function readWideMatrixWorkbook(workbook: XLSX.WorkBook): FlatSheet | null {
  const vocab = sheetRows(workbook, 'App Vocabulary');
  if (vocab.length === 0) return null;

  const rawHeaders = Object.keys(vocab[0]);
  // Long-format (schema 5.x) sheets carry a Language column — not this reader's job.
  if (rawHeaders.some(h => h.toLowerCase().trim() === 'language')) return null;

  const langHeaders = rawHeaders.filter(h => {
    const key = h.toLowerCase().trim();
    return (
      h &&
      !h.startsWith('__EMPTY') &&
      !WIDE_META.has(key) &&
      !/disambiguation$/.test(key) &&
      !/card label$/.test(key)
    );
  });
  if (langHeaders.length === 0) return null;

  // Card Labels override the matrix text for a given sense + language.
  type Label = { label: string; disambiguation: string };
  const labels = new Map<string, Label>();
  sheetRows(workbook, 'Card Labels').forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const language = pick(row, k => k === 'language');
    const label = pick(row, k => k === 'card label');
    if (!senseId || !language || !label) return;
    labels.set(`${senseId}|${language}`, {
      label,
      disambiguation: pick(row, k => k === 'disambiguation'),
    });
  });

  // Alternatives are other legitimate expressions of the SAME sense.
  const alternatives = new Map<string, { text: string; latin: string }[]>();
  sheetRows(workbook, 'Alternatives').forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const language = pick(row, k => k === 'language');
    const text = pick(row, k => k === 'alternative entry' || k === 'alternative');
    if (!senseId || !language || !text) return;
    const key = `${senseId}|${language}`;
    const list = alternatives.get(key) ?? [];
    if (!list.some(e => e.text === text)) list.push({ text, latin: pick(row, k => k === 'latin') });
    alternatives.set(key, list);
  });

  const latinOf = (header: string) => `${header} Latin`;
  const hasLatinColumn = new Set(langHeaders.filter(h => langHeaders.includes(latinOf(h))));

  const rows: Record<string, string>[] = [];
  vocab.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    if (!senseId || isCatchAllSense(senseId)) return;
    const playable = pick(row, k => k === 'playable');
    if (playable && !yes(playable)) return;

    const out: Record<string, string> = {
      // one Sense ID = one vocabulary line, and its permanent identity
      'Word ID': senseId,
      'Sense ID': senseId,
      'Vocab Word ID': pick(row, k => k === 'word id'),
      'Part of Speech': pickPos(row),
    };

    langHeaders.forEach(header => {
      const isLatin = / Latin$/i.test(header);
      const base = isLatin ? header.replace(/ Latin$/i, '') : header;
      const language = base === 'Pinyin' ? 'Chinese' : base;
      const key = `${senseId}|${language}`;
      const alts = alternatives.get(key) ?? [];

      let primary = str(row[header]);
      if (!isLatin) {
        const override = labels.get(key);
        if (override) {
          primary = override.disambiguation
            ? `${override.label} (${override.disambiguation})`
            : override.label;
        }
      }

      const extra = isLatin ? alts.map(a => a.latin) : alts.map(a => a.text);
      const values = [primary, ...extra].filter(Boolean);
      // Latin stays aligned with its language: only emit it when complete.
      out[header] = isLatin && !primary ? '' : values.join(', ');
    });

    // A line must carry at least one language value to be playable.
    if (langHeaders.some(h => !/ Latin$/i.test(h) && out[h])) rows.push(out);
  });

  if (rows.length === 0) return null;
  void hasLatinColumn;
  return { headers: langHeaders, rows };
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
/** Grammatical class column, however the workbook spells it */
const pickPos = (row: Record<string, unknown>) =>
  pick(row, k => k === 'pos' || k === 'part of speech' || k === 'word type' || k === 'word class' || k === '词性');

const isCatchAllSense = (senseId: string) => /-S0*0$/i.test(senseId);

const isAssigned = (row: Record<string, unknown>) => {
  const status = pick(row, k => k === 'sense assignment status' || k === 'assignment status');
  // Missing column = older sheet: treat as assigned, Playable still gates it.
  return !status || status.toLowerCase() === 'assigned';
};

/**
 * Contract 5.0: "App Vocabulary" is the authoritative sheet.
 * One Entry ID = one lexical entry. Entries are never merged back together by
 * Word ID; they are only aligned by Sense ID so the same meaning across
 * languages lands on the same playable line (far / distant / remote stay
 * separate lines because they carry separate Sense IDs).
 */
function readAppVocabularySheet(workbook: XLSX.WorkBook): FlatSheet | null {
  const entries = sheetRows(workbook, 'App Vocabulary');
  if (entries.length === 0) return null;

  // Chinese / Pinyin for every sense come from the Sense Map.
  type Base = { chinese: string; pinyin: string; wordId: string; pos: string };
  const base = new Map<string, Base>();
  const senseOrder: string[] = [];
  sheetRows(workbook, 'Sense Map').forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    if (!senseId || isCatchAllSense(senseId) || !isAssigned(row) || base.has(senseId)) return;
    senseOrder.push(senseId);
    base.set(senseId, {
      chinese: pick(row, k => k === 'chinese' || k.startsWith('chinese |')),
      pinyin: pick(row, k => k === 'pinyin'),
      wordId: pick(row, k => k === 'word id') || senseId.replace(/-S\d+$/i, ''),
      pos: pickPos(row),
    });
  });

  type Entry = { label: string; latin: string; canonical: boolean };
  const languages: string[] = [];
  const hasLatin = new Set<string>();
  const bySense = new Map<string, Map<string, Entry[]>>();

  entries.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const language = pick(row, k => k === 'language');
    const label = pick(row, k => k === 'card label') || pick(row, k => k === 'main entry');
    if (!senseId || !language || !label) return;
    if (isCatchAllSense(senseId) || !isAssigned(row)) return;

    if (!base.has(senseId)) {
      senseOrder.push(senseId);
      base.set(senseId, {
        chinese: pick(row, k => k === 'chinese'),
        pinyin: pick(row, k => k === 'pinyin'),
        wordId: pick(row, k => k === 'word id') || senseId.replace(/-S\d+$/i, ''),
        pos: pickPos(row),
      });
    }

    const rowPos = pickPos(row);
    const known = base.get(senseId);
    if (known && !known.pos && rowPos) known.pos = rowPos;

    if (!languages.includes(language)) languages.push(language);
    let perLang = bySense.get(senseId);
    if (!perLang) bySense.set(senseId, (perLang = new Map()));
    const list = perLang.get(language) ?? [];
    if (!list.some(e => e.label === label)) {
      const latin = pick(row, k => k === 'latin');
      const keepLatin = !!latin && latin !== label && language.toLowerCase() !== 'english';
      if (keepLatin) hasLatin.add(language);
      list.push({ label, latin: keepLatin ? latin : '', canonical: yes(row['Is Canonical']) });
    }
    perLang.set(language, list);
  });

  const headers = ['Chinese | 中文', 'Pinyin'];
  languages.forEach(language => {
    headers.push(language);
    if (hasLatin.has(language)) headers.push(`${language} Latin`);
  });

  const rows: Record<string, string>[] = senseOrder
    .filter(senseId => bySense.has(senseId))
    .map(senseId => {
      const info = base.get(senseId)!;
      const row: Record<string, string> = {
        'Word ID': senseId,
        'Sense ID': senseId,
        'Vocab Word ID': info.wordId,
        'Chinese | 中文': info.chinese,
        Pinyin: info.pinyin,
        'Part of Speech': info.pos,
      };
      const perLang = bySense.get(senseId);
      languages.forEach(language => {
        const list = [...(perLang?.get(language) ?? [])].sort(
          (a, b) => Number(b.canonical) - Number(a.canonical),
        );
        row[language] = list.map(e => e.label).join(', ');
        if (hasLatin.has(language)) {
          const latin = list.map(e => e.latin);
          row[`${language} Latin`] = latin.every(Boolean) ? latin.join(', ') : latin.find(Boolean) ?? '';
        }
      });
      return row;
    })
    .filter(row => row['Chinese | 中文'] || languages.some(l => row[l]));

  return rows.length ? { headers, rows } : null;
}

/** Flatten an app-ready workbook into headers + one row per SENSE. Returns null when it isn't one. */
export function readAppReadyWorkbook(workbook: XLSX.WorkBook): FlatSheet | null {
  if (!isAppReadyWorkbook(workbook)) return null;

  // Contract 5.0 workbooks: App Vocabulary wins over the legacy Reverse Index.
  const appVocabulary = readAppVocabularySheet(workbook);
  if (appVocabulary) return appVocabulary;


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
  const sensePos = new Map<string, string>();
  senses.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const p = pickPos(row);
    if (senseId && p && !sensePos.has(senseId)) sensePos.set(senseId, p);
  });

  reverse.forEach(row => {
    const senseId = pick(row, k => k === 'sense id');
    const language = pick(row, k => k === 'language');
    const label = pick(row, k => k === 'card label') || pick(row, k => k === 'main entry');
    if (!senseId || !language || !label || !senseById.has(senseId)) return;

    // Only reviewed, playable entries feed normal gameplay.
    if (!yes(row['Playable']) || !isAssigned(row)) return;

    const rowPos = pickPos(row);
    if (rowPos && !sensePos.get(senseId)) sensePos.set(senseId, rowPos);

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
        'Part of Speech': sensePos.get(sense.senseId) ?? '',
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
