import * as XLSX from 'xlsx';
import { detectLanguageFromHeader, getLanguage, romanizationCodeFor } from './languages';
import { readAppReadyWorkbook } from './appReadyWorkbook';



export interface VocabularyItem {
  id: string;
  /** language code -> word/translation */
  values: Record<string, string>;
  /** language codes that were manually edited by the user */
  edited?: Record<string, boolean>;
}

export interface SheetData {
  success: boolean;
  error?: string;
  headers: string[];
  rows: Record<string, string>[];
  /** header -> detected language code (or null when unknown) */
  detected: Record<string, string | null>;
  /** original file name, used as the vocabulary set name */
  fileName?: string;
}

/** header -> language code, or 'ignore' */
export type ColumnMapping = Record<string, string>;

function readWorkbook(arrayBuffer: ArrayBuffer): SheetData {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // App-ready workbooks (Sense Map + Reverse Index) are normalized across sheets —
  // flatten them back to one row per word before the usual header detection runs.
  const appReady = readAppReadyWorkbook(workbook);

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = appReady
    ? appReady.rows
    : XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });

  if (rows.length === 0) {
    return { success: false, error: 'The file is empty', headers: [], rows: [], detected: {} };
  }

  const headers = (appReady ? appReady.headers : Object.keys(rows[0])).filter(
    h => h && !h.startsWith('__EMPTY') && !/\bexamples?\b/i.test(h) && h.toLowerCase().trim() !== 'word id',
  );

  const detected: Record<string, string | null> = {};
  headers.forEach(h => {
    detected[h] = detectLanguageFromHeader(h);
  });

  // A bare "Transliteration" / "Pinyin" / "Pronunciation" column belongs to the
  // language of the closest column on its left (or right) — re-anchor it there.
  const BARE = /^(transliteration|translit|romanization|romanisation|romanized|latin|pronunciation|phonetic|reading|pinyin|romaji|romaja)$/;
  headers.forEach((header, index) => {
    const key = header.toLowerCase().trim();
    const code = detected[header];
    if (!BARE.test(key) && !(code && getLanguage(code).romanizationOf && BARE.test(key))) return;

    const neighbours = [...headers.slice(0, index).reverse(), ...headers.slice(index + 1)];
    for (const other of neighbours) {
      const otherCode = detected[other];
      if (!otherCode || getLanguage(otherCode).romanizationOf) continue;
      const rom = romanizationCodeFor(otherCode);
      if (rom) {
        detected[header] = rom;
        return;
      }
    }
  });


  return { success: true, headers, rows, detected };
}

export async function parseExcelFile(file: File): Promise<SheetData> {
  try {
    return { ...readWorkbook(await file.arrayBuffer()), fileName: file.name };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      headers: [],
      rows: [],
      detected: {},
    };
  }
}

export async function fetchExcelFromUrl(url: string): Promise<SheetData> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    return readWorkbook(await response.arrayBuffer());
  } catch (error) {
    return {
      success: false,
      error: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      headers: [],
      rows: [],
      detected: {},
    };
  }
}

/**
 * Build a mapping automatically: the first column is always the main language,
 * every other column that can be recognised is mapped to its language.
 * Returns null when the first column's language can't be detected.
 */
export function autoMapping(sheet: SheetData): ColumnMapping | null {
  if (!sheet.success || sheet.headers.length === 0) return null;

  const [first, ...rest] = sheet.headers;
  const mainLang = sheet.detected[first];
  if (!mainLang) return null;

  const used = new Set<string>([mainLang]);
  const mapping: ColumnMapping = { [first]: mainLang };

  rest.forEach(header => {
    const lang = sheet.detected[header];
    if (lang && !used.has(lang)) {
      used.add(lang);
      mapping[header] = lang;
    } else {
      mapping[header] = 'ignore';
    }
  });

  return mapping;
}

/** Turn raw sheet rows into vocabulary items using a header -> language mapping */
export function buildVocabulary(sheet: SheetData, mapping: ColumnMapping, mainLang: string): VocabularyItem[] {
  const entries = Object.entries(mapping).filter(([, lang]) => lang && lang !== 'ignore');

  return sheet.rows
    .map((row, index) => {
      const values: Record<string, string> = {};
      entries.forEach(([header, lang]) => {
        const value = String(row[header] ?? '').trim();
        if (value) values[lang] = value;
      });
      return { id: `vocab-${index}`, values, edited: {} };
    })
    .filter(item => (item.values[mainLang] || '').length > 0);
}

export function createBatches(items: VocabularyItem[], batchSize: number = 5): VocabularyItem[][] {
  const batches: VocabularyItem[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
