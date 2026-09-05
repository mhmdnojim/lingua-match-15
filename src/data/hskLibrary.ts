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

export const HSK_LIBRARY_NAME = 'HSK Dataset v7';
/** v8 — same 11,530 senses, rows pre-ordered by semantic category (related groups) */
export const HSK_V8_LIBRARY_NAME = 'HSK Dataset v8 (Grouped)';

const ASSETS_V7: Record<HskLevel, string> = {
  HSK1: '/__l5e/assets-v1/c35187ea-d1f1-42fb-8174-441924cb3443/hsk-hsk1.json',
  HSK2: '/__l5e/assets-v1/a087abd9-be94-4764-a835-f37793fc31db/hsk-hsk2.json',
  HSK3: '/__l5e/assets-v1/d24f9a73-8e77-47dd-880a-830366102d1c/hsk-hsk3.json',
  HSK4: '/__l5e/assets-v1/ab6ffdd0-2ed7-47cb-9ca3-d96e91bb7bfc/hsk-hsk4.json',
  HSK5: '/__l5e/assets-v1/3a49b83c-6f2f-4544-9de7-15fb288c50bc/hsk-hsk5.json',
  HSK6: '/__l5e/assets-v1/f082dd5a-39df-435b-987b-966a278990a2/hsk-hsk6.json',
};

const ASSETS_V8: Record<HskLevel, string> = {
  HSK1: '/__l5e/assets-v1/99acef37-501b-46d8-ab89-e25108437e5b/hsk8-hsk1.json',
  HSK2: '/__l5e/assets-v1/d093ec19-f2e3-477b-ba8f-cb7492a5e249/hsk8-hsk2.json',
  HSK3: '/__l5e/assets-v1/22d0c9aa-56c8-4920-b230-a0bb82b4464b/hsk8-hsk3.json',
  HSK4: '/__l5e/assets-v1/a387b00b-2848-4b2d-b7df-f0192e35f577/hsk8-hsk4.json',
  HSK5: '/__l5e/assets-v1/f7a9cf35-4264-4a27-8e7e-1c9a7182d91f/hsk8-hsk5.json',
  HSK6: '/__l5e/assets-v1/433fe188-4c6d-4c4c-976e-017aaecc95f4/hsk8-hsk6.json',
};

const DATASET_ASSETS: Record<string, Record<HskLevel, string>> = {
  [HSK_LIBRARY_NAME]: ASSETS_V7,
  [HSK_V8_LIBRARY_NAME]: ASSETS_V8,
};

/** Picker entries — the FileSelector groups each dataset into one family with a level dropdown */
export const HSK_LIBRARY_FILES = [
  ...HSK_LEVELS.map(level => `${HSK_LIBRARY_NAME} · ${level}.xlsx`),
  ...HSK_LEVELS.map(level => `${HSK_V8_LIBRARY_NAME} · ${level}.xlsx`),
];

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

const cache = new Map<string, Pack>();

/** Dataset family name (the part before " · ") for a library file */
const datasetOf = (source?: string): string => {
  const family = (source ?? '').replace(/\.(xlsx|xls)$/i, '').split(' · ')[0];
  return DATASET_ASSETS[family] ? family : HSK_LIBRARY_NAME;
};

async function fetchPack(level: HskLevel, source?: string): Promise<Pack> {
  const dataset = datasetOf(source);
  const key = `${dataset}:${level}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const response = await fetch(DATASET_ASSETS[dataset][level]);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const pack = (await response.json()) as Pack;
  cache.set(key, pack);
  return pack;
}

/**
 * Load one level as a sheet, with `mainLang` as the first column and every other
 * registered language following in the standard order.
 * `source` (the picker file name) selects the dataset family; defaults to v7.
 */
export async function loadHskLevel(level: HskLevel, mainLang: string, source?: string): Promise<SheetData> {
  const pack = await fetchPack(level, source);
  const dataset = datasetOf(source);
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
