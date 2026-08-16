import * as XLSX from 'xlsx';

/**
 * Reader for the "App-Ready" HSK workbook schema (Schema Version 4.x).
 *
 * Structure:
 *   <Level>        one row per word, incl. a permanent "Word ID"
 *   Sense Map      Sense ID -> Chinese / Pinyin / English sense
 *   Reverse Index  one row per (Word ID, Sense ID, Language) with Card Label + Latin
 *   Review Queue / Sources / App Schema — metadata, not consumed by the game
 *
 * The game board wants one flat row per word with one cell per language, so this
 * module flattens the normalized workbook back into that shape:
 *   - Card Label is used for the card text (Main Entry keeps the long definition)
 *   - Playable = Yes entries win; canonical entries are the fallback
 *   - several playable labels for the same language become "a, b" so the existing
 *     multi-meaning panel can offer the alternatives
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

/** Flatten an app-ready workbook into headers + one row per word. Returns null when it isn't one. */
export function readAppReadyWorkbook(workbook: XLSX.WorkBook): FlatSheet | null {
  if (!isAppReadyWorkbook(workbook)) return null;

  const reverse = sheetRows(workbook, 'Reverse Index');
  if (reverse.length === 0) return null;

  const senses = sheetRows(workbook, 'Sense Map');
  const vocabSheetName = workbook.SheetNames.find(
    n => !['Sources', 'Sense Map', 'Reverse Index', 'Review Queue', 'App Schema'].includes(n),
  );
  const vocab = vocabSheetName ? sheetRows(workbook, vocabSheetName) : [];

  // --- base word list (Word ID -> Chinese / Pinyin) -------------------------
  const order: string[] = [];
  const base = new Map<string, { chinese: string; pinyin: string }>();

  const pick = (row: Record<string, unknown>, test: (key: string) => boolean) => {
    const key = Object.keys(row).find(k => test(k.toLowerCase().trim()));
    return key ? str(row[key]) : '';
  };

  vocab.forEach(row => {
    const id = pick(row, k => k === 'word id');
    if (!id) return;
    order.push(id);
    base.set(id, {
      chinese: pick(row, k => k === 'chinese' || k.startsWith('chinese |') || k.startsWith('chinese|')),
      pinyin: pick(row, k => k === 'pinyin'),
    });
  });

  senses.forEach(row => {
    const id = str(row['Word ID']);
    if (!id) return;
    if (!base.has(id)) {
      order.push(id);
      base.set(id, { chinese: str(row['Chinese']), pinyin: str(row['Pinyin']) });
    } else {
      const entry = base.get(id)!;
      if (!entry.chinese) entry.chinese = str(row['Chinese']);
      if (!entry.pinyin) entry.pinyin = str(row['Pinyin']);
    }
  });

  if (order.length === 0) return null;

  // --- per language labels --------------------------------------------------
  type Bucket = { labels: string[]; latin: string[] };
  const languages: string[] = [];
  const hasLatin = new Set<string>();
  // wordId -> language -> tier -> bucket ; tier 0 = playable, 1 = canonical, 2 = rest
  const byWord = new Map<string, Map<string, Bucket[]>>();

  reverse.forEach(row => {
    const wordId = str(row['Word ID']);
    const language = str(row['Language']);
    const label = str(row['Card Label']) || str(row['Main Entry']);
    if (!wordId || !language || !label || !base.has(wordId)) return;

    if (!languages.includes(language)) languages.push(language);

    const tier = yes(row['Playable']) ? 0 : yes(row['Is Canonical']) ? 1 : 2;
    let perLang = byWord.get(wordId);
    if (!perLang) byWord.set(wordId, (perLang = new Map()));
    let tiers = perLang.get(language);
    if (!tiers) perLang.set(language, (tiers = [
      { labels: [], latin: [] },
      { labels: [], latin: [] },
      { labels: [], latin: [] },
    ]));

    const bucket = tiers[tier];
    if (!bucket.labels.includes(label)) {
      bucket.labels.push(label);
      const latin = str(row['Latin']);
      // Latin-script languages repeat the entry in the Latin column — that is not
      // a transliteration, so only keep it when it really differs from the text.
      if (latin && latin !== label && latin !== str(row['Main Entry'])) {
        bucket.latin.push(latin);
        hasLatin.add(language);
      } else {
        bucket.latin.push('');
      }
    }
  });

  // --- build the flat rows --------------------------------------------------
  const headers = ['Chinese | 中文', 'Pinyin'];
  languages.forEach(language => {
    headers.push(language);
    if (hasLatin.has(language)) headers.push(`${language} Latin`);
  });

  const rows: Record<string, string>[] = order
    .map(wordId => {
      const info = base.get(wordId)!;
      const row: Record<string, string> = {
        'Word ID': wordId,
        'Chinese | 中文': info.chinese,
        Pinyin: info.pinyin,
      };
      const perLang = byWord.get(wordId);
      languages.forEach(language => {
        const tiers = perLang?.get(language);
        const chosen = tiers?.find(t => t.labels.length > 0);
        row[language] = chosen ? chosen.labels.join(', ') : '';
        if (hasLatin.has(language)) {
          const latin = (chosen?.latin ?? []).filter(Boolean);
          row[`${language} Latin`] = latin.length === (chosen?.labels.length ?? 0) ? latin.join(', ') : latin[0] ?? '';
        }
      });
      return row;
    })
    .filter(row => row['Chinese | 中文']);

  return rows.length ? { headers, rows } : null;
}
