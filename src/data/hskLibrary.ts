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

/** New HSK 3.0 multilingual workbook: 6,183 part-specific senses, HSK1–HSK6, 12 languages */
export const NHSK_LIBRARY_NAME = 'New HSK 1–6 (Multilingual)';

const NHSK_LANGS = ['zh', 'en', 'ar', 'ru', 'tk', 'ur', 'de', 'fr', 'id', 'kk', 'fa', 'vi'];

/** Order here is the order shown in the vocabulary picker */
const DATASETS: DatasetDef[] = [
  {
    name: NHSK_LIBRARY_NAME,
    levels: [...HSK_LEVELS],
    langs: NHSK_LANGS,
    defaultMain: 'zh',
    groupSenses: false,
    splitSynonyms: true,
    assets: {
      HSK1: '/__l5e/assets-v1/6decc229-c604-4333-bf49-f74103e250bb/nhsk-HSK1.json',
      HSK2: '/__l5e/assets-v1/6e927dec-5663-4e0e-a353-16cc8a10ca81/nhsk-HSK2.json',
      HSK3: '/__l5e/assets-v1/be9d25f8-9e9c-4e35-a09b-5ad54cf0146f/nhsk-HSK3.json',
      HSK4: '/__l5e/assets-v1/f6ae236f-8dcc-4a6f-b690-841af1a58f70/nhsk-HSK4.json',
      HSK5: '/__l5e/assets-v1/e1a06c9f-6cfe-4ac9-af95-3a852bb76d52/nhsk-HSK5.json',
      HSK6: '/__l5e/assets-v1/664d0ea3-3268-470c-9e93-e6f270ebfc03/nhsk-HSK6.json',
    },
  },
  {
    name: ENDICT_LIBRARY_NAME,
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    langs: ENDICT_LANGS,
    defaultMain: 'en',
    groupSenses: false,
    splitSynonyms: true,
    assets: {
      A1: '/__l5e/assets-v1/d78e0b3a-9fe8-4d06-a482-3713355db84f/endict-A1.json',
      A2: '/__l5e/assets-v1/adb2590c-53f9-43dc-9246-120a16f27b9d/endict-A2.json',
      B1: '/__l5e/assets-v1/029cacfb-df92-4bc8-9f11-48b664f310ed/endict-B1.json',
      B2: '/__l5e/assets-v1/373c077e-3d17-409f-b46b-e46351e5e807/endict-B2.json',
      C1: '/__l5e/assets-v1/c8f66430-6968-4851-af8c-c032d2274bd9/endict-C1.json',
    },

  },
  {
    name: HSK_V8_LIBRARY_NAME,
    levels: [...HSK_LEVELS],
    langs: HSK_LANGS,
    defaultMain: 'zh',
    assets: {
      HSK1: '/__l5e/assets-v1/d5f7f5d7-48bf-4bd4-992f-d21ec7895230/hsk8-HSK1.json',
      HSK2: '/__l5e/assets-v1/206fe5b8-56bd-47c6-a52f-4fdbd39fdfcb/hsk8-HSK2.json',
      HSK3: '/__l5e/assets-v1/9375b685-b0bc-4037-a244-8576a94691c8/hsk8-HSK3.json',
      HSK4: '/__l5e/assets-v1/4eb1465b-ce9a-4de0-88dd-c10bf6c448f9/hsk8-HSK4.json',
      HSK5: '/__l5e/assets-v1/a39601fe-efbb-42f8-8533-58f324c3eb9a/hsk8-HSK5.json',
      HSK6: '/__l5e/assets-v1/9936f437-3eae-4a6a-b14b-07c857fd2b57/hsk8-HSK6.json',
    },
  },
  {
    name: HSK_LIBRARY_NAME,
    levels: [...HSK_LEVELS],
    langs: HSK_LANGS,
    defaultMain: 'zh',
    assets: {
      HSK1: '/__l5e/assets-v1/def45027-9e21-4c77-88c7-b2e2f1bb4b60/hsk-HSK1.json',
      HSK2: '/__l5e/assets-v1/ba16b245-c42e-4774-ae58-ca6b6da7888a/hsk-HSK2.json',
      HSK3: '/__l5e/assets-v1/03f1d3b2-343b-4d81-9815-65833d680eac/hsk-HSK3.json',
      HSK4: '/__l5e/assets-v1/51e8cc44-c82c-4c44-a8b6-de0c6053bec5/hsk-HSK4.json',
      HSK5: '/__l5e/assets-v1/294d5e8f-624d-43f4-af42-a3cbe893958e/hsk-HSK5.json',
      HSK6: '/__l5e/assets-v1/ede0d560-1056-484e-b9ee-a955ca2f643a/hsk-HSK6.json',
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
  // Some hosts serve the CDN packs with a generic content-type; trust the body
  // instead of the header and only fail when it really isn't JSON.
  const text = await response.text();
  let pack: Pack;
  try {
    pack = JSON.parse(text) as Pack;
  } catch {
    throw new Error(`Could not read the data pack for ${dataset.name} ${level}`);
  }
  if (!pack || !Array.isArray(pack.rows)) {
    throw new Error(`Empty data pack for ${dataset.name} ${level}`);
  }
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
      Definition: row.d ?? '',
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
      // The sense definition is shown through the card's definition button, not
      // as a cramped subtitle.
      const disambiguation = entry?.d || (!sameScript && entry?.l) || undefined;
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
