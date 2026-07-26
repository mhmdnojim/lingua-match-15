import * as XLSX from 'xlsx';
import { VocabularyItem } from './excelParser';
import { ColumnConfig } from './gameLogic';
import { getLanguage } from './languages';

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

  const headers = ordered.map(c => getLanguage(c.lang)?.name ?? c.lang);
  const rows = items.map(item => ordered.map(c => item.values?.[c.lang] ?? ''));

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map(() => ({ wch: 24 }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Vocabulary');

  const base = source.replace(/\.(xlsx|xls)$/i, '') || 'vocabulary';
  XLSX.writeFile(book, `${base}-translated.xlsx`);
};
