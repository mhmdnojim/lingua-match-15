import * as XLSX from 'xlsx';
import { VocabularyItem } from './excelParser';
import { ColumnConfig } from './gameLogic';
import { getLanguage, romanizationCodeFor } from './languages';

/**
 * Export the full vocabulary list (all batches, including AI-generated columns)
 * to an .xlsx file the user downloads.
 */
export const exportVocabularyToExcel = (
  items: VocabularyItem[],
  columns: ColumnConfig[],
  mainLang: string,
  source = 'vocabulary',
) => {
  const ordered = [
    ...columns.filter(c => c.lang === mainLang),
    ...columns.filter(c => c.lang !== mainLang),
  ];

  // Keep every language stored on the words — including romanization / Latin
  // pseudo-columns and languages that are currently hidden.
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

  const headers = ['Entry ID', ...langs.map(code => getLanguage(code)?.name ?? code)];
  const rows = items.map(item => [item.id, ...langs.map(code => item.values?.[code] ?? '')]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map(() => ({ wch: 24 }));


  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Vocabulary');

  const base = source.replace(/\.(xlsx|xls)$/i, '') || 'vocabulary';
  XLSX.writeFile(book, `${base}-translated.xlsx`);
};
