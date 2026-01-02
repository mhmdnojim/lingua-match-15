import * as XLSX from 'xlsx';

export interface VocabularyItem {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  arabic?: string;
}

export interface ParseResult {
  success: boolean;
  data: VocabularyItem[];
  error?: string;
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
    
    if (jsonData.length === 0) {
      return { success: false, data: [], error: 'Excel file is empty' };
    }

    const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
    
    const chineseKey = findColumnKey(headers, ['chinese', '中文', 'hanzi', '汉字']);
    const pinyinKey = findColumnKey(headers, ['pinyin', '拼音', 'pronunciation']);
    const englishKey = findColumnKey(headers, ['english', '英文', 'meaning', 'definition']);
    const arabicKey = findColumnKey(headers, ['arabic', 'عربي', 'العربية']);

    if (!chineseKey || !englishKey) {
      return { 
        success: false, 
        data: [], 
        error: 'Missing required columns: Chinese and English are required' 
      };
    }

    const originalHeaders = Object.keys(jsonData[0]);
    const chineseHeader = originalHeaders.find(h => h.toLowerCase().trim() === chineseKey);
    const pinyinHeader = pinyinKey ? originalHeaders.find(h => h.toLowerCase().trim() === pinyinKey) : null;
    const englishHeader = originalHeaders.find(h => h.toLowerCase().trim() === englishKey);
    const arabicHeader = arabicKey ? originalHeaders.find(h => h.toLowerCase().trim() === arabicKey) : null;

    const data: VocabularyItem[] = jsonData.map((row, index) => ({
      id: `vocab-${index}-${Date.now()}`,
      chinese: String(row[chineseHeader!] || '').trim(),
      pinyin: pinyinHeader ? String(row[pinyinHeader] || '').trim() : '',
      english: String(row[englishHeader!] || '').trim(),
      arabic: arabicHeader ? String(row[arabicHeader] || '').trim() : undefined,
    })).filter(item => item.chinese && item.english);

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      data: [], 
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function fetchExcelFromUrl(url: string): Promise<ParseResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
    
    if (jsonData.length === 0) {
      return { success: false, data: [], error: 'Excel file is empty' };
    }

    const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
    
    const chineseKey = findColumnKey(headers, ['chinese', '中文', 'hanzi', '汉字']);
    const pinyinKey = findColumnKey(headers, ['pinyin', '拼音', 'pronunciation']);
    const englishKey = findColumnKey(headers, ['english', '英文', 'meaning', 'definition']);
    const arabicKey = findColumnKey(headers, ['arabic', 'عربي', 'العربية']);

    if (!chineseKey || !englishKey) {
      return { 
        success: false, 
        data: [], 
        error: 'Missing required columns: Chinese and English are required' 
      };
    }

    const originalHeaders = Object.keys(jsonData[0]);
    const chineseHeader = originalHeaders.find(h => h.toLowerCase().trim() === chineseKey);
    const pinyinHeader = pinyinKey ? originalHeaders.find(h => h.toLowerCase().trim() === pinyinKey) : null;
    const englishHeader = originalHeaders.find(h => h.toLowerCase().trim() === englishKey);
    const arabicHeader = arabicKey ? originalHeaders.find(h => h.toLowerCase().trim() === arabicKey) : null;

    const data: VocabularyItem[] = jsonData.map((row, index) => ({
      id: `vocab-${index}-${Date.now()}`,
      chinese: String(row[chineseHeader!] || '').trim(),
      pinyin: pinyinHeader ? String(row[pinyinHeader] || '').trim() : '',
      english: String(row[englishHeader!] || '').trim(),
      arabic: arabicHeader ? String(row[arabicHeader] || '').trim() : undefined,
    })).filter(item => item.chinese && item.english);

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      data: [], 
      error: `Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

function findColumnKey(headers: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const found = headers.find(h => h === name.toLowerCase());
    if (found) return found;
  }
  return null;
}

export function createBatches(items: VocabularyItem[], batchSize: number = 5): VocabularyItem[][] {
  const batches: VocabularyItem[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
