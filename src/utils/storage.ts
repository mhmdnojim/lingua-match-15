import { GameMode } from './gameLogic';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

const STORAGE_KEYS = {
  CURRENT_BATCH: 'vocab-game-current-batch',
  COMPLETED_BATCHES: 'vocab-game-completed-batches',
  SCORE: 'vocab-game-score',
  GAME_MODE: 'vocab-game-mode',
  SHOW_PINYIN: 'vocab-game-show-pinyin',
  MUTE_VOICE: 'vocab-game-mute-voice',
  MUTE_SFX: 'vocab-game-mute-sfx',
  SELECTED_FILE: 'vocab-game-selected-file',
  VOICE_TYPE: 'vocab-game-voice-type',
  FONT_SIZE: 'vocab-game-font-size',
} as const;

export interface GameProgress {
  currentBatch: number;
  completedBatches: number[];
  score: number;
  gameMode: GameMode;
  showPinyin: boolean;
  muteVoice: boolean;
  muteSfx: boolean;
  selectedFile: string | null;
  voiceType: VoiceType;
  fontSize: FontSize;
}

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
    if (progress.gameMode !== undefined) {
      localStorage.setItem(STORAGE_KEYS.GAME_MODE, progress.gameMode);
    }
    if (progress.showPinyin !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SHOW_PINYIN, String(progress.showPinyin));
    }
    if (progress.muteVoice !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MUTE_VOICE, String(progress.muteVoice));
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
  } catch (error) {
    console.warn('Failed to save progress to localStorage:', error);
  }
}

export function loadProgress(): GameProgress {
  try {
    const completedBatchesStr = localStorage.getItem(STORAGE_KEYS.COMPLETED_BATCHES);
    
    return {
      currentBatch: parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_BATCH) || '0', 10),
      completedBatches: completedBatchesStr ? JSON.parse(completedBatchesStr) : [],
      score: parseInt(localStorage.getItem(STORAGE_KEYS.SCORE) || '0', 10),
      gameMode: (localStorage.getItem(STORAGE_KEYS.GAME_MODE) as GameMode) || '2-column',
      showPinyin: localStorage.getItem(STORAGE_KEYS.SHOW_PINYIN) !== 'false',
      muteVoice: localStorage.getItem(STORAGE_KEYS.MUTE_VOICE) === 'true',
      muteSfx: localStorage.getItem(STORAGE_KEYS.MUTE_SFX) === 'true',
      selectedFile: localStorage.getItem(STORAGE_KEYS.SELECTED_FILE) || null,
      voiceType: (localStorage.getItem(STORAGE_KEYS.VOICE_TYPE) as VoiceType) || 'free',
      fontSize: (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSize) || 'medium',
    };
  } catch (error) {
    console.warn('Failed to load progress from localStorage:', error);
    return {
      currentBatch: 0,
      completedBatches: [],
      score: 0,
      gameMode: '2-column',
      showPinyin: true,
      muteVoice: false,
      muteSfx: false,
      selectedFile: null,
      voiceType: 'free',
      fontSize: 'medium',
    };
  }
}

export function clearProgress(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear progress from localStorage:', error);
  }
}