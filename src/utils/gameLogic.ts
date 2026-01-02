import { VocabularyItem } from './excelParser';

export type CardType = 'chinese' | 'pinyin' | 'english' | 'arabic';
export type GameMode = '2-column' | '3-column';

export interface GameCard {
  id: string;
  vocabId: string;
  type: CardType;
  content: string;
  pinyin?: string;
  isSelected: boolean;
  isMatched: boolean;
  isError: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  matchedVocabId?: string;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createGameCards(
  vocabulary: VocabularyItem[],
  mode: GameMode,
  showPinyin: boolean,
  showArabic: boolean = false
): { chinese: GameCard[]; pinyin: GameCard[]; english: GameCard[]; arabic: GameCard[] } {
  const chineseCards: GameCard[] = vocabulary.map(item => ({
    id: `chinese-${item.id}`,
    vocabId: item.id,
    type: 'chinese' as CardType,
    content: item.chinese,
    pinyin: showPinyin ? item.pinyin : undefined,
    isSelected: false,
    isMatched: false,
    isError: false,
  }));

  const englishCards: GameCard[] = vocabulary.map(item => ({
    id: `english-${item.id}`,
    vocabId: item.id,
    type: 'english' as CardType,
    content: item.english,
    isSelected: false,
    isMatched: false,
    isError: false,
  }));

  const pinyinCards: GameCard[] = mode === '3-column' 
    ? vocabulary.map(item => ({
        id: `pinyin-${item.id}`,
        vocabId: item.id,
        type: 'pinyin' as CardType,
        content: item.pinyin,
        isSelected: false,
        isMatched: false,
        isError: false,
      }))
    : [];

  const arabicCards: GameCard[] = showArabic
    ? vocabulary.filter(item => item.arabic).map(item => ({
        id: `arabic-${item.id}`,
        vocabId: item.id,
        type: 'arabic' as CardType,
        content: item.arabic!,
        isSelected: false,
        isMatched: false,
        isError: false,
      }))
    : [];

  return {
    chinese: shuffleArray(chineseCards),
    pinyin: shuffleArray(pinyinCards),
    english: shuffleArray(englishCards),
    arabic: shuffleArray(arabicCards),
  };
}

export function checkMatch(selectedCards: GameCard[], mode: GameMode, showArabic: boolean = false): MatchResult {
  const requiredCount = getRequiredSelections(mode, showArabic);
  if (selectedCards.length !== requiredCount) {
    return { isMatch: false };
  }
  const vocabIds = selectedCards.map(c => c.vocabId);
  const isMatch = vocabIds.every(id => id === vocabIds[0]);
  return { isMatch, matchedVocabId: isMatch ? vocabIds[0] : undefined };
}

export function getRequiredSelections(mode: GameMode, showArabic: boolean = false): number {
  const base = mode === '2-column' ? 2 : 3;
  return showArabic ? base + 1 : base;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
