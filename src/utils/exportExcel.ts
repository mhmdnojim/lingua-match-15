import * as XLSX from 'xlsx';
import { VocabularyItem } from './excelParser';
import { ColumnConfig } from './gameLogic';
import { getLanguage, romanizationCodeFor } from './languages';

/**
 * Every language stored on the words — including romanization / Latin
 * pseudo-columns and languages that are currently hidden — in column order:
 * MAIN first, then the rest as configured.
 */
const collectLangs = (items: VocabularyItem[], columns: ColumnConfig[], mainLang: string) => {
  const ordered = [
    ...columns.filter(c => c.lang === mainLang),
    ...columns.filter(c => c.lang !== mainLang),
  ];
  const langs: string[] = [];
  const push = (code: string) => {
    if (code && !langs.includes(code)) langs.push(code);
  };
  ordered.forEach(c => {
    push(c.lang);
    const rom = romanizationCodeFor(c.lang);
    if (rom && items.some(i => (i.values?.[rom] || '').trim())) push(rom);
  });
  items.forEach(item => Object.keys(item.values || {}).forEach(push));
  return langs;
};

/** One level sheet: Sense ID identity, source provenance, then one column per language. */
const buildLevelSheet = (items: VocabularyItem[], columns: ColumnConfig[], mainLang: string) => {
  const langs = collectLangs(items, columns, mainLang);
  const headers = [
    'Sense ID',
    'Source Word ID',
    'Part of Speech',
    ...langs.map(code => getLanguage(code)?.name ?? code),
  ];
  const rows = items.map(item => [
    item.id,
    item.sourceWordId ?? '',
    item.pos ?? '',
    ...langs.map(code => item.values?.[code] ?? ''),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map(() => ({ wch: 24 }));
  return sheet;
};

/**
 * Export the full vocabulary list (all batches, including AI-generated columns)
 * to an .xlsx file the user downloads — one "Vocabulary" sheet.
 */
export const exportVocabularyToExcel = (
  items: VocabularyItem[],
  columns: ColumnConfig[],
  mainLang: string,
  source = 'vocabulary',
) => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, buildLevelSheet(items, columns, mainLang), 'Vocabulary');

  const base = source.replace(/\.(xlsx|xls)$/i, '') || 'vocabulary';
  XLSX.writeFile(book, `${base}-translated.xlsx`);
};

/**
 * Export a whole workbook family — one sheet per level (HSK1…HSK6 / A1…C1),
 * matching the original files' structure.
 */
export const exportLevelsToExcel = (
  levels: { name: string; items: VocabularyItem[] }[],
  columns: ColumnConfig[],
  mainLang: string,
  base: string,
) => {
  const book = XLSX.utils.book_new();
  levels.forEach(({ name, items }) => {
    XLSX.utils.book_append_sheet(book, buildLevelSheet(items, columns, mainLang), name.slice(0, 31) || 'Vocabulary');
  });
  XLSX.writeFile(book, `${base}-all-levels.xlsx`);
};
