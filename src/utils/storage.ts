import { ColumnConfig } from './gameLogic';
import { VocabularyItem } from './excelParser';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

const STORAGE_KEYS = {
  CURRENT_BATCH: 'vocab-game-current-batch',
  COMPLETED_BATCHES: 'vocab-game-completed-batches',
  SCORE: 'vocab-game-score',
  MUTE_SFX: 'vocab-game-mute-sfx',
  SELECTED_FILE: 'vocab-game-selected-file',
  VOICE_TYPE: 'vocab-game-voice-type',
  FONT_SIZE: 'vocab-game-font-size',
  COLUMNS: 'vocab-game-columns',
  VOCABULARY: 'vocab-game-vocabulary',
} as const;

export interface GameProgress {
  currentBatch: number;
  completedBatches: number[];
  score: number;
  muteSfx: boolean;
  selectedFile: string | null;
  voiceType: VoiceType;
  fontSize: FontSize;
  columns: ColumnConfig[] | null;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { lang: 'zh', visible: true, muted: false, showRomanization: true },
  { lang: 'zh-pinyin', visible: true, muted: false, showRomanization: false },
  { lang: 'en', visible: true, muted: false, showRomanization: false },
  { lang: 'ar', visible: true, muted: false, showRomanization: false },
];

export function saveProgress(progress: Partial<GameProgress>): void {
  try {
    if (progress.currentBatch !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BATCH, String(progress.currentBatch));
    }
    if (progress.completedBatches !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_BATCHES, JSON.stringify(progress.completedBatches));
    }
    if (progress.score !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SCORE, String(progress.score));
    }
    if (progress.muteSfx !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MUTE_SFX, String(progress.muteSfx));
    }
    if (progress.selectedFile !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, progress.selectedFile || '');
    }
    if (progress.voiceType !== undefined) {
      localStorage.setItem(STORAGE_KEYS.VOICE_TYPE, progress.voiceType);
    }
    if (progress.fontSize !== undefined) {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, progress.fontSize);
    }
    if (progress.columns !== undefined && progress.columns !== null) {
      localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(progress.columns));
    }
  } catch (error) {
    console.warn('Failed to save progress to localStorage:', error);
  }
}

export function loadProgress(): GameProgress {
  const fallback: GameProgress = {
    currentBatch: 0,
    completedBatches: [],
    score: 0,
    muteSfx: false,
    selectedFile: null,
    voiceType: 'free',
    fontSize: 'medium',
    columns: null,
  };

  try {
    const completedBatchesStr = localStorage.getItem(STORAGE_KEYS.COMPLETED_BATCHES);
    const columnsStr = localStorage.getItem(STORAGE_KEYS.COLUMNS);

    return {
      currentBatch: parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_BATCH) || '0', 10),
      completedBatches: completedBatchesStr ? JSON.parse(completedBatchesStr) : [],
      score: parseInt(localStorage.getItem(STORAGE_KEYS.SCORE) || '0', 10),
      muteSfx: localStorage.getItem(STORAGE_KEYS.MUTE_SFX) === 'true',
      selectedFile: localStorage.getItem(STORAGE_KEYS.SELECTED_FILE) || null,
      voiceType: (localStorage.getItem(STORAGE_KEYS.VOICE_TYPE) as VoiceType) || 'free',
      fontSize: (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSize) || 'medium',
      columns: columnsStr ? (JSON.parse(columnsStr) as ColumnConfig[]) : null,
    };
  } catch (error) {
    console.warn('Failed to load progress from localStorage:', error);
    return fallback;
  }
}

export interface StoredVocabulary {
  items: VocabularyItem[];
  mainLang: string;
  source: string;
}

export function saveVocabulary(data: StoredVocabulary): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save vocabulary:', error);
  }
}

export function loadVocabularyCache(): StoredVocabulary | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
    return raw ? (JSON.parse(raw) as StoredVocabulary) : null;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear progress from localStorage:', error);
  }
}
