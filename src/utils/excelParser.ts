import * as XLSX from 'xlsx';
import { detectLanguageFromHeader, getLanguage, romanizationCodeFor } from './languages';
import { readAppReadyWorkbook, ENTRIES_COLUMN, SheetEntry } from './appReadyWorkbook';



/** One exact lexical expression for a (sense, language) pair, as declared by the file */
export type LexicalEntry = SheetEntry;

export interface VocabularyItem {
  /** Sense ID for semantic workbooks — the only key that decides matching */
  id: string;
  /** language code -> word/translation */
  values: Record<string, string>;
  /** language codes that were manually edited by the user */
  edited?: Record<string, boolean>;
  /** grammatical class of the word: noun, verb, adjective, … */
  pos?: string;
  /** file-declared expressions per language code (canonical first, then alternatives) */
  entries?: Record<string, LexicalEntry[]>;
  /** original source vocabulary item — provenance only, never a matching key */
  sourceWordId?: string;
}


/** Column header that carries the grammatical class rather than a language */
export const POS_HEADER = 'Part of Speech';
export const isPosHeader = (header: string) =>
  /^(pos|part[\s_-]*of[\s_-]*speech|word[\s_-]*(type|class)|grammar|grammatical[\s_-]*class|词性|詞性)$/i.test(
    header.trim(),
  );

/** Normalize free-form POS text to a short, readable label */
export function normalizePos(raw: string): string {
  const value = String(raw ?? '').trim().toLowerCase().replace(/[.\s]+$/, '');
  if (!value) return '';
  const map: Record<string, string> = {
    n: 'noun', noun: 'noun', nouns: 'noun',
    v: 'verb', verb: 'verb', vi: 'verb', vt: 'verb',
    adj: 'adjective', a: 'adjective', adjective: 'adjective',
    adv: 'adverb', adverb: 'adverb',
    pron: 'pronoun', pronoun: 'pronoun',
    prep: 'preposition', preposition: 'preposition',
    conj: 'conjunction', conjunction: 'conjunction',
    interj: 'interjection', int: 'interjection', interjection: 'interjection',
    num: 'numeral', numeral: 'numeral', number: 'numeral',
    det: 'determiner', determiner: 'determiner', art: 'article', article: 'article',
    part: 'particle', particle: 'particle',
    mw: 'measure word', classifier: 'measure word', 'measure word': 'measure word',
    phrase: 'phrase', idiom: 'idiom', name: 'proper noun', 'proper noun': 'proper noun',
  };
  return map[value] ?? value;
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
  /** language the workbook is built around (per-MAIN-language workbooks) */
  mainLang?: string;
  /** every level sheet the workbook contains */
  levels?: string[];
  /** the level sheet this data came from */
  level?: string;
}

/** header -> language code, or 'ignore' */
export type ColumnMapping = Record<string, string>;

function readBook(workbook: XLSX.WorkBook, sheetName?: string): SheetData {
  // Per-MAIN-language workbooks (HSK_MAIN_XX.xlsx) are read natively: the MAIN
  // block becomes the first column and each level sheet is its own set.
  const main = readMainLanguageWorkbook(workbook, sheetName);
  if (main) {
    return {
      success: true,
      headers: main.headers,
      rows: main.rows,
      detected: main.detected,
      mainLang: main.mainLang,
      levels: main.levels,
      level: main.level,
    };
  }

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

  const META = new Set(['word id', 'sense id', 'vocab word id']);
  const rawHeaders = appReady ? appReady.headers : Object.keys(rows[0]);

  // A part-of-speech column is metadata, not a language — copy it onto a stable
  // key so buildVocabulary can pick it up, and keep it out of the mapping UI.
  const posHeader = rawHeaders.find(isPosHeader) || (rows[0][POS_HEADER] !== undefined ? POS_HEADER : undefined);
  if (posHeader && posHeader !== POS_HEADER) {
    rows.forEach(row => {
      row[POS_HEADER] = String(row[posHeader] ?? '');
    });
  }

  const headers = rawHeaders.filter(
    h =>
      h &&
      !h.startsWith('__EMPTY') &&
      !/\bexamples?\b/i.test(h) &&
      !META.has(h.toLowerCase().trim()) &&
      !isPosHeader(h),
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

      // Semantic workbooks ship the exact expressions per language (canonical +
      // file-declared alternatives). They are never derived from punctuation.
      let declared: Record<string, LexicalEntry[]> | undefined;
      const raw = String(row[ENTRIES_COLUMN] ?? '');
      if (raw) {
        try {
          const byHeader = JSON.parse(raw) as Record<string, LexicalEntry[]>;
          declared = {};
          entries.forEach(([header, lang]) => {
            const list = byHeader[header];
            if (list?.length) declared![lang] = list;
          });
          if (Object.keys(declared).length === 0) declared = undefined;
        } catch {
          declared = undefined;
        }
      }

      // Sense ID (when present) is the permanent identity of the line, so edits
      // and cloud data stay attached to the same sense across re-imports.
      const stableId = String(row['Sense ID'] ?? row['Word ID'] ?? '').trim();
      const sourceWordId = String(row['Vocab Word ID'] ?? '').trim();
      const pos = normalizePos(String(row[POS_HEADER] ?? ''));
      return {
        id: stableId || `vocab-${index}`,
        values,
        edited: {},
        ...(pos ? { pos } : {}),
        ...(declared ? { entries: declared } : {}),
        ...(sourceWordId ? { sourceWordId } : {}),
      };
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
