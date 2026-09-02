import { getLanguage, romanizationCodeFor } from '@/utils/languages';
import { ENTRIES_COLUMN, SheetEntry } from '@/utils/appReadyWorkbook';
import type { SheetData } from '@/utils/excelParser';

/**
 * Built-in HSK vocabulary library (Schema v6 data pack).
 *
 * One data file per HSK level, each carrying every one of the 15 registered
 * languages for the same Sense ID. Choosing a MAIN language therefore never
 * requires a different file — the columns are simply re-ordered.
 */

export const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];

export const HSK_LIBRARY_NAME = 'HSK Library';

const ASSETS: Record<HskLevel, string> = {
  HSK1: '/__l5e/assets-v1/a0c96968-a536-4d36-a70f-c82643d57734/hsk-hsk1.json',
  HSK2: '/__l5e/assets-v1/b4434af0-ae25-4b10-ba61-61d9a323a370/hsk-hsk2.json',
  HSK3: '/__l5e/assets-v1/bf025f32-b458-4ac4-8b40-62db9a22f1ae/hsk-hsk3.json',
  HSK4: '/__l5e/assets-v1/188b10b1-f60d-42b8-804a-e3fae882f62c/hsk-hsk4.json',
  HSK5: '/__l5e/assets-v1/7b38c602-5a1e-4ba1-ab06-8110c453c76b/hsk-hsk5.json',
  HSK6: '/__l5e/assets-v1/a24a0c59-592f-4c70-aacb-39220d3208c0/hsk-hsk6.json',
};

/** Picker entries — the FileSelector groups these into one family with level chips */
export const HSK_LIBRARY_FILES = HSK_LEVELS.map(level => `${HSK_LIBRARY_NAME} · ${level}.xlsx`);

/**
 * The 15 MAIN languages shipped inside every data pack (one per HSK_MAIN_XX
 * workbook of the v6 delivery). Any of them can be the leftmost column without
 * loading a different file.
 */
export const HSK_LIBRARY_LANGS = [
  'zh', 'en', 'ar', 'bg', 'kk', 'id', 'ms', 'tk', 'ru', 'fa', 'ur', 'vi', 'de', 'nl', 'fr',
] as const;

export const isHskLibraryFile = (source: string) => HSK_LIBRARY_FILES.includes(source);

export const hskLevelOf = (source: string): HskLevel | null => {
  const level = source.replace(/\.(xlsx|xls)$/i, '').split(' · ')[1];
  return (HSK_LEVELS as readonly string[]).includes(level) ? (level as HskLevel) : null;
};

/** One language block of a sense, as delivered by the data pack */
interface PackEntry {
  /** canonical expression */
  e: string;
  /** short card label when it differs from the expression */
  l?: string;
  /** transliteration */
  r?: string;
  /** card label / disambiguation */
  d?: string;
  /** approved synonyms */
  a?: string[];
}

interface PackRow {
  /** Sense ID — the only semantic identity */
  id: string;
  /** Source Word ID */
  w?: string;
  /** part of speech */
  p?: string;
  /** English semantic definition of this exact sense */
  d?: string;
  /** Chinese source headword */
  zh?: string;
  /** five numbered example sentences */
  x?: string;
  v: Record<string, PackEntry>;
}

interface Pack {
  level: HskLevel;
  langs: string[];
  rows: PackRow[];
}

const cache = new Map<HskLevel, Pack>();

async function fetchPack(level: HskLevel): Promise<Pack> {
  const cached = cache.get(level);
  if (cached) return cached;
  const response = await fetch(ASSETS[level]);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const pack = (await response.json()) as Pack;
  cache.set(level, pack);
  return pack;
}

/**
 * Load one level as a sheet, with `mainLang` as the first column and every other
 * registered language following in the standard order.
 */
export async function loadHskLevel(level: HskLevel, mainLang: string): Promise<SheetData> {
  const pack = await fetchPack(level);
  const main = pack.langs.includes(mainLang) ? mainLang : 'zh';
  const langs = [main, ...pack.langs.filter(lang => lang !== main)];

  const nameOf = (code: string) => getLanguage(code).name;
  const hasLatin = new Set<string>();
  const rows: Record<string, string>[] = [];

  pack.rows.forEach(row => {
    const out: Record<string, string> = {
      'Sense ID': row.id,
      'Word ID': row.id,
      'Vocab Word ID': row.w ?? '',
      'Part of Speech': row.p ?? '',
    };
    const entriesByHeader: Record<string, SheetEntry[]> = {};

    langs.forEach(lang => {
      const entry = row.v[lang];
      if (!entry?.e) return;
      const label = entry.l || entry.e;
      const header = nameOf(lang);
      entriesByHeader[header] = [
        {
          text: label,
          mainEntry: entry.e,
          latin: entry.r,
          canonical: true,
          disambiguation: entry.d || (lang === main ? row.d : undefined),
        },
        ...(entry.a ?? [])
          .filter(text => text !== label && text !== entry.e)
          .map(text => ({ text, mainEntry: text, canonical: false })),
      ];
      out[header] = label;

      const rom = romanizationCodeFor(lang);
      if (entry.r && rom) {
        out[nameOf(rom)] = entry.r;
        hasLatin.add(lang);
      }
    });

    if (!out[nameOf(main)]) return;
    out[ENTRIES_COLUMN] = JSON.stringify(entriesByHeader);
    rows.push(out);
  });

  const headers: string[] = [];
  const detected: Record<string, string | null> = {};
  langs.forEach(lang => {
    const header = nameOf(lang);
    headers.push(header);
    detected[header] = lang;
    const rom = romanizationCodeFor(lang);
    if (rom && hasLatin.has(lang)) {
      const romHeader = nameOf(rom);
      headers.push(romHeader);
      detected[romHeader] = rom;
    }
  });

  return {
    success: true,
    headers,
    rows,
    detected,
    mainLang: main,
    levels: [...HSK_LEVELS],
    level,
    fileName: `${HSK_LIBRARY_NAME} · ${level}.xlsx`,
  };
}
