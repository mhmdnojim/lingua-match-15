import * as XLSX from 'xlsx';
import { ENTRIES_COLUMN, SheetEntry } from './appReadyWorkbook';
import { getLanguage, romanizationCodeFor } from './languages';

/**
 * Reader for the per-MAIN-language HSK workbooks (HSK_MAIN_XX.xlsx).
 *
 * Shape:
 *   one sheet per level (HSK1 … HSK6), one row per Sense ID
 *   MAIN <field>          the workbook's main language block
 *   <CODE> <field>        one block per translation language (ZH, EN, AR, …)
 *   Sense ID / Source Word ID / Part of Speech / Level  — shared identity columns
 *
 * Everything else (Card Key, Lexeme ID, Entry ID, Chinese Source Headword,
 * English Reference Gloss, Legacy Alternatives) is provenance and never becomes
 * a language column.
 */

const CODE_TO_LANG: Record<string, string> = {
  ZH: 'zh', 'ZH-TW': 'zh-TW', EN: 'en', AR: 'ar', ES: 'es', FR: 'fr', DE: 'de', IT: 'it',
  PT: 'pt', NL: 'nl', SV: 'sv', PL: 'pl', RU: 'ru', TR: 'tr', JA: 'ja', KO: 'ko', HI: 'hi',
  UR: 'ur', FA: 'fa', HE: 'he', ID: 'id', MS: 'ms', VI: 'vi', TH: 'th', BG: 'bg', KK: 'kk',
  TK: 'tk',
};

const str = (v: unknown) => String(v ?? '').trim();

const headersOf = (sheet: XLSX.WorkSheet): string[] => {
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 });
  return (rows[0] ?? []).map(h => str(h));
};

/** Sheets that follow the MAIN-language schema (one per level) */
export function mainLanguageSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames.filter(name => {
    const sheet = workbook.Sheets[name];
    return !!sheet && headersOf(sheet).some(h => /^main expression$/i.test(h));
  });
}

export function isMainLanguageWorkbook(workbook: XLSX.WorkBook): boolean {
  return mainLanguageSheetNames(workbook).length > 0;
}

const splitAlternatives = (raw: string): string[] =>
  raw
    .split(/\r?\n|\s*\|\s*|\s*;\s*/)
    .map(s => s.trim())
    .filter(Boolean);

export interface MainLanguageSheet {
  headers: string[];
  rows: Record<string, string>[];
  /** header -> language code */
  detected: Record<string, string | null>;
  /** language code of the workbook's MAIN column */
  mainLang: string;
  /** every level sheet in this workbook */
  levels: string[];
  /** the level that was read */
  level: string;
}

/** Read one level sheet of a per-MAIN-language workbook. */
export function readMainLanguageWorkbook(
  workbook: XLSX.WorkBook,
  sheetName?: string,
): MainLanguageSheet | null {
  const levels = mainLanguageSheetNames(workbook);
  if (levels.length === 0) return null;
  const level = sheetName && levels.includes(sheetName) ? sheetName : levels[0];

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[level], { defval: '' });
  if (raw.length === 0) return null;

  const sheetHeaders = Object.keys(raw[0]);
  const mainCodeRaw = str(raw.find(r => str(r['MAIN Language Code']))?.['MAIN Language Code']).toUpperCase();
  const mainLang = CODE_TO_LANG[mainCodeRaw] ?? mainCodeRaw.toLowerCase();
  if (!mainLang) return null;

  // Which language blocks exist in this sheet, in file order — MAIN always first.
  const blocks: { prefix: string; lang: string }[] = [{ prefix: 'MAIN', lang: mainLang }];
  sheetHeaders.forEach(header => {
    const m = /^([A-Z]{2,5}(?:-[A-Z]{2})?) Expression$/.exec(header.trim());
    if (!m) return;
    const lang = CODE_TO_LANG[m[1]];
    if (!lang || lang === mainLang || blocks.some(b => b.lang === lang)) return;
    blocks.push({ prefix: m[1], lang });
  });

  const field = (row: Record<string, unknown>, prefix: string, ...names: string[]) => {
    for (const name of names) {
      const key = `${prefix} ${name}`;
      if (row[key] !== undefined && str(row[key])) return str(row[key]);
    }
    return '';
  };

  const nameOf = (code: string) => getLanguage(code).name;
  const latinName = (code: string) => {
    const rom = romanizationCodeFor(code);
    return rom ? getLanguage(rom).name : null;
  };

  const hasLatin = new Set<string>();
  const rows: Record<string, string>[] = [];

  raw.forEach(row => {
    const senseId = str(row['Sense ID']);
    if (!senseId || /-S0*0$/i.test(senseId)) return;

    const out: Record<string, string> = {
      'Sense ID': senseId,
      'Word ID': senseId,
      'Vocab Word ID': str(row['Source Word ID']),
      'Part of Speech': str(row['Part of Speech']),
    };
    const entriesByHeader: Record<string, SheetEntry[]> = {};

    blocks.forEach(({ prefix, lang }) => {
      const expression = field(row, prefix, 'Expression');
      if (!expression) return;

      const label = field(row, prefix, 'Card Label') || expression;
      const disambiguation =
        field(row, prefix, 'Disambiguation') || field(row, prefix, 'Card Label / Disambiguation');
      const latin = field(row, prefix, 'Transliteration');
      const alternatives = splitAlternatives(
        field(row, prefix, 'Approved Synonyms / Alternatives', 'Approved Synonyms', 'Alternatives'),
      ).filter(text => text !== expression && text !== label);

      const header = nameOf(lang);
      entriesByHeader[header] = [
        { text: label, mainEntry: expression, latin, canonical: true, disambiguation },
        ...alternatives.map(text => ({ text, mainEntry: text, canonical: false })),
      ];
      out[header] = label;

      const romHeader = latinName(lang);
      if (latin && romHeader) {
        out[romHeader] = latin;
        hasLatin.add(lang);
      }
    });

    if (!out[nameOf(mainLang)]) return;
    out[ENTRIES_COLUMN] = JSON.stringify(entriesByHeader);
    rows.push(out);
  });

  if (rows.length === 0) return null;

  const headers: string[] = [];
  const detected: Record<string, string | null> = {};
  blocks.forEach(({ lang }) => {
    const header = nameOf(lang);
    headers.push(header);
    detected[header] = lang;
    const rom = romanizationCodeFor(lang);
    if (rom && hasLatin.has(lang)) {
      const romHeader = getLanguage(rom).name;
      headers.push(romHeader);
      detected[romHeader] = rom;
    }
  });

  return { headers, rows, detected, mainLang, levels, level };
}
