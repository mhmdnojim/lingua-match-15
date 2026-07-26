import { ColumnConfig } from './gameLogic';
import { VocabularyItem } from './excelParser';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';
/** Translate only the current batch, or the whole uploaded file at once */
export type TranslateScope = 'batch' | 'all';

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
  SHUFFLE_MODE: 'vocab-game-shuffle-mode',
  UI_STATE: 'vocab-game-ui-state',
  TRANSLATE_SCOPE: 'vocab-game-translate-scope',
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
  shuffleMode: boolean;
  translateScope: TranslateScope;
}

/** Which panels/dialogs were open when the app was closed */
export interface UiState {
  languagesOpen: boolean;
  wordEditorOpen: boolean;
  settingsOpen: boolean;
  /** Whether the top chrome (title, options, stats, progress) is expanded */
  headerOpen: boolean;
}

const DEFAULT_UI_STATE: UiState = {
  languagesOpen: false,
  wordEditorOpen: false,
  settingsOpen: false,
  headerOpen: true,
};

export function saveUiState(state: Partial<UiState>): void {
  try {
    const current = loadUiState();
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify({ ...current, ...state }));
  } catch (error) {
    console.warn('Failed to save UI state:', error);
  }
}

export function loadUiState(): UiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    return raw ? { ...DEFAULT_UI_STATE, ...(JSON.parse(raw) as Partial<UiState>) } : DEFAULT_UI_STATE;
  } catch {
    return DEFAULT_UI_STATE;
  }
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
    if (progress.translateScope !== undefined) {
      localStorage.setItem(STORAGE_KEYS.TRANSLATE_SCOPE, progress.translateScope);
    }
    if (progress.shuffleMode !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SHUFFLE_MODE, String(progress.shuffleMode));
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
    shuffleMode: true,
    translateScope: 'batch',
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
      shuffleMode: (localStorage.getItem(STORAGE_KEYS.SHUFFLE_MODE) ?? 'true') === 'true',
      translateScope: (localStorage.getItem(STORAGE_KEYS.TRANSLATE_SCOPE) as TranslateScope) || 'batch',
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

/* ------------------------------------------------------------------ *
 * Library of uploaded files — every imported file is kept on its own *
 * so the user can switch between them from the vocabulary picker.    *
 * ------------------------------------------------------------------ */

const LIBRARY_KEY = 'vocab-game-library';
const setKey = (source: string) => `vocab-game-set:${source}`;

export function listLocalSources(): string[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveVocabularySet(data: StoredVocabulary): void {
  try {
    localStorage.setItem(setKey(data.source), JSON.stringify(data));
    const list = listLocalSources();
    if (!list.includes(data.source)) {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify([...list, data.source]));
    }
  } catch (error) {
    console.warn('Failed to save vocabulary set:', error);
  }
}

export function loadVocabularySet(source: string): StoredVocabulary | null {
  try {
    const raw = localStorage.getItem(setKey(source));
    return raw ? (JSON.parse(raw) as StoredVocabulary) : null;
  } catch {
    return null;
  }
}

export function deleteVocabularySet(source: string): void {
  try {
    localStorage.removeItem(setKey(source));
    const list = listLocalSources().filter(s => s !== source);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Failed to delete vocabulary set:', error);
  }
}
