import { getLanguage, romanizationCodeFor } from '@/utils/languages';
import { ENTRIES_COLUMN, SheetEntry } from '@/utils/appReadyWorkbook';
import type { SheetData } from '@/utils/excelParser';

/**
 * Built-in vocabulary library.
 *
 * Every dataset ships one compact JSON data pack per level, each carrying all of
 * its languages for the same Sense ID. Choosing a MAIN language therefore never
 * requires a different file — the columns are simply re-ordered.
 */

export const HSK_LEVELS = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as const;
export type HskLevel = string;

/** v8 — same 11,530 senses, rows pre-ordered by semantic category (related groups) */
export const HSK_V8_LIBRARY_NAME = 'HSK Dataset v8 (Grouped)';
export const HSK_LIBRARY_NAME = 'HSK Dataset v7';

const HSK_LANGS = [
  'zh', 'en', 'ar', 'bg', 'kk', 'id', 'ms', 'tk', 'ru', 'fa', 'ur', 'vi', 'de', 'nl', 'fr',
];

interface DatasetDef {
  name: string;
  levels: string[];
  langs: string[];
  defaultMain: string;
  /**
   * false = definition-anchored dataset: two rows of the same word are two
   * different meanings and must stay separate cards. Synonyms only ever come
   * from one cell, comma/semicolon separated.
   */
  groupSenses?: boolean;
  /** split a cell on commas/semicolons into canonical + synonym expressions */
  splitSynonyms?: boolean;
  assets: Record<string, string>;
}

/** Definition-anchored English dictionary: one row = one exact meaning */
export const ENDICT_LIBRARY_NAME = 'English Dictionary A1–C1';

const ENDICT_LANGS = ['en', 'ar', 'zh', 'ru', 'tk', 'kk', 'bg', 'id', 'ms', 'ur', 'de', 'fr', 'fa'];

/** Order here is the order shown in the vocabulary picker */
const DATASETS: DatasetDef[] = [
  {
    name: ENDICT_LIBRARY_NAME,
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    langs: ENDICT_LANGS,
    defaultMain: 'en',
    groupSenses: false,
    splitSynonyms: true,
    assets: {
      A1: '/__l5e/assets-v1/f490d132-43a8-4ad6-adc0-f2254ed2ae97/endict-a1.json',
      A2: '/__l5e/assets-v1/f488b04c-912a-4c69-a80f-e2688f217a4c/endict-a2.json',
      B1: '/__l5e/assets-v1/63ccab59-b520-4eaf-ad76-7ce6054d6e69/endict-b1.json',
      B2: '/__l5e/assets-v1/43b9ec5f-c17c-4636-8f81-789aecb32eca/endict-b2.json',
      C1: '/__l5e/assets-v1/503d7098-efbc-4761-a39d-45df1f358c07/endict-c1.json',
    },
  },
  {
    name: HSK_V8_LIBRARY_NAME,
    levels: [...HSK_LEVELS],
    langs: HSK_LANGS,
    defaultMain: 'zh',
    assets: {
      HSK1: '/__l5e/assets-v1/99acef37-501b-46d8-ab89-e25108437e5b/hsk8-hsk1.json',
      HSK2: '/__l5e/assets-v1/d093ec19-f2e3-477b-ba8f-cb7492a5e249/hsk8-hsk2.json',
      HSK3: '/__l5e/assets-v1/22d0c9aa-56c8-4920-b230-a0bb82b4464b/hsk8-hsk3.json',
      HSK4: '/__l5e/assets-v1/a387b00b-2848-4b2d-b7df-f0192e35f577/hsk8-hsk4.json',
      HSK5: '/__l5e/assets-v1/f7a9cf35-4264-4a27-8e7e-1c9a7182d91f/hsk8-hsk5.json',
      HSK6: '/__l5e/assets-v1/433fe188-4c6d-4c4c-976e-017aaecc95f4/hsk8-hsk6.json',
    },
  },
  {
    name: HSK_LIBRARY_NAME,
    levels: [...HSK_LEVELS],
    langs: HSK_LANGS,
    defaultMain: 'zh',
    assets: {
      HSK1: '/__l5e/assets-v1/c35187ea-d1f1-42fb-8174-441924cb3443/hsk-hsk1.json',
      HSK2: '/__l5e/assets-v1/a087abd9-be94-4764-a835-f37793fc31db/hsk-hsk2.json',
      HSK3: '/__l5e/assets-v1/d24f9a73-8e77-47dd-880a-830366102d1c/hsk-hsk3.json',
      HSK4: '/__l5e/assets-v1/ab6ffdd0-2ed7-47cb-9ca3-d96e91bb7bfc/hsk-hsk4.json',
      HSK5: '/__l5e/assets-v1/3a49b83c-6f2f-4544-9de7-15fb288c50bc/hsk-hsk5.json',
      HSK6: '/__l5e/assets-v1/f082dd5a-39df-435b-987b-966a278990a2/hsk-hsk6.json',
    },
  },
];

/** Picker entries — the FileSelector groups each dataset into one family with a level dropdown */
export const HSK_LIBRARY_FILES = DATASETS.flatMap(dataset =>
  dataset.levels.map(level => `${dataset.name} · ${level}.xlsx`),
);

/** Languages available as MAIN in the HSK data packs */
export const HSK_LIBRARY_LANGS = HSK_LANGS;

const familyOf = (source?: string) =>
  (source ?? '').replace(/\.(xlsx|xls)$/i, '').split(' · ')[0];

const datasetOf = (source?: string): DatasetDef =>
  DATASETS.find(dataset => dataset.name === familyOf(source)) ??
  DATASETS.find(dataset => dataset.name === HSK_LIBRARY_NAME)!;

export const isHskLibraryFile = (source: string) => HSK_LIBRARY_FILES.includes(source);

/**
 * Whether senses sharing a headword should be merged into one card.
 * Definition-anchored datasets keep every sense separate.
 */
export const libraryGroupsSenses = (source?: string): boolean =>
  datasetOf(source).groupSenses !== false;

/** Levels of the dataset a picker file belongs to */
export const libraryLevelsFor = (source?: string): string[] => datasetOf(source).levels;

/** MAIN-language choices of the dataset a picker file belongs to */
export const libraryLangsFor = (source?: string): string[] => datasetOf(source).langs;

/** Default MAIN language of the dataset a picker file belongs to */
export const libraryDefaultMain = (source?: string): string => datasetOf(source).defaultMain;

export const hskLevelOf = (source: string): HskLevel | null => {
  const level = source.replace(/\.(xlsx|xls)$/i, '').split(' · ')[1];
  return datasetOf(source).levels.includes(level) ? level : null;
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
  level: string;
  langs: string[];
  rows: PackRow[];
}

const cache = new Map<string, Pack>();

/** Coarse script family of a string: 'cjk', 'latin', 'arabic', 'cyrillic', or 'other' */
function scriptFamily(text: string): string {
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf)) return 'cjk';
    if (cp >= 0x0600 && cp <= 0x06ff) return 'arabic';
    if (cp >= 0x0400 && cp <= 0x04ff) return 'cyrillic';
    if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a) || (cp >= 0xc0 && cp <= 0x24f) || (cp >= 0x1e00 && cp <= 0x1eff)) return 'latin';
  }
  return 'other';
}

async function fetchPack(level: string, source?: string): Promise<Pack> {
  const dataset = datasetOf(source);
  const key = `${dataset.name}:${level}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = dataset.assets[level];
  if (!url) throw new Error(`Unknown level "${level}" for ${dataset.name}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    throw new Error(`Unexpected content-type "${contentType}" for ${dataset.name} ${level}`);
  }
  const pack = (await response.json()) as Pack;
  cache.set(key, pack);
  return pack;
}

/**
 * Load one level as a sheet, with `mainLang` as the first column and every other
 * registered language following in the standard order.
 * `source` (the picker file name) selects the dataset family.
 */
export async function loadHskLevel(level: string, mainLang: string, source?: string): Promise<SheetData> {
  const pack = await fetchPack(level, source);
  const dataset = datasetOf(source);
  const main = pack.langs.includes(mainLang) ? mainLang : dataset.defaultMain;
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
      if (!entry?.e && !(lang === 'zh' && row.zh)) return;
      // `Chinese Source Headword` is the workbook's authoritative Chinese
      // expression. The ZH language block can contain an English reference/card
      // label, so it must never replace this source value on a Chinese card.
      const expression = lang === 'zh' && row.zh ? row.zh : entry?.e ?? '';
      // The workbook's "Card Label / Disambiguation" column can hold a gloss in
      // another script (e.g. an English gloss on the ZH block). Only let the
      // label replace the expression when both share the same script family;
      // otherwise the label is disambiguation, not display text.
      const sameScript = entry?.l && scriptFamily(entry.l) === scriptFamily(expression);
      const label = sameScript ? entry?.l ?? expression : expression;
      const disambiguation =
        entry?.d || (!sameScript && entry?.l) || (lang === main ? row.d : undefined);
      const header = nameOf(lang);
      // In definition-anchored datasets, expressions listed in one cell and
      // separated by a comma / semicolon ARE synonyms of that one meaning.
      const parts = dataset.splitSynonyms
        ? label.split(/[,;،؛，；]/).map(part => part.trim()).filter(Boolean)
        : [label];
      const primary = parts[0] || label;
      const synonyms = [...parts.slice(1), ...(entry?.a ?? [])];
      entriesByHeader[header] = [
        {
          text: primary,
          mainEntry: expression,
          latin: entry?.r,
          canonical: true,
          disambiguation,
        },
        ...synonyms
          .filter((text, i, all) => text !== primary && all.indexOf(text) === i)
          .map(text => ({ text, mainEntry: text, canonical: false })),
      ];
      out[header] = primary;

      const rom = romanizationCodeFor(lang);
      if (entry?.r && rom) {
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
    levels: [...dataset.levels],
    level,
    fileName: `${dataset.name} · ${level}.xlsx`,
  };
}

export interface HskSearchHit {
  level: string;
  /** Sense ID */
  id: string;
  /** expression per language code */
  values: Record<string, string>;
  /** transliteration of the main language, when present */
  latin?: string;
  /** English semantic definition of the sense */
  definition?: string;
}

/**
 * Search every level of a dataset family for a query, matching against the
 * expression, card label, transliteration, and approved synonyms of every
 * language. Returns at most `limit` hits, lower levels first.
 */
export async function searchHskLibrary(
  query: string,
  source?: string,
  limit = 50,
): Promise<HskSearchHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const dataset = datasetOf(source);
  const settled = await Promise.allSettled(dataset.levels.map(level => fetchPack(level, source)));
  const packs = settled
    .filter((r): r is PromiseFulfilledResult<Pack> => r.status === 'fulfilled')
    .map(r => r.value);
  if (!packs.length) throw new Error('Could not load any dataset level for search');
  const hits: HskSearchHit[] = [];
  for (const pack of packs) {
    for (const row of pack.rows) {
      const values: Record<string, string> = {};
      let matched = false;
      for (const lang of pack.langs) {
        const entry = row.v[lang];
        if (!entry?.e) continue;
        values[lang] = entry.e;
        if (
          entry.e.toLowerCase().includes(q) ||
          entry.l?.toLowerCase().includes(q) ||
          entry.r?.toLowerCase().includes(q) ||
          entry.a?.some(text => text.toLowerCase().includes(q))
        ) {
          matched = true;
        }
      }
      if (!matched && (row.d?.toLowerCase().includes(q) || row.zh?.includes(q))) matched = true;
      if (!matched) continue;
      hits.push({
        level: pack.level,
        id: row.id,
        values,
        latin: undefined,
        definition: row.d,
      });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
