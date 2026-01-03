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

// Get first letter of pinyin (ignoring tone marks)
function getPinyinInitial(pinyin: string): string {
  const normalized = pinyin.toLowerCase().trim();
  return normalized.charAt(0) || '';
}

// Smart shuffle: max 2 consecutive same pinyin initials, different tones preferred
export function smartShuffleByPinyin<T extends { pinyin?: string; content?: string }>(array: T[]): T[] {
  if (array.length <= 2) return shuffleArray(array);
  
  // Group items by their pinyin initial
  const groups: Map<string, T[]> = new Map();
  
  array.forEach(item => {
    const pinyin = item.pinyin || item.content || '';
    const initial = getPinyinInitial(pinyin);
    if (!groups.has(initial)) {
      groups.set(initial, []);
    }
    groups.get(initial)!.push(item);
  });
  
  // Shuffle within each group
  groups.forEach((items, key) => {
    groups.set(key, shuffleArray(items));
  });
  
  // Build result with max 2 consecutive same initials
  const result: T[] = [];
  const availableGroups = new Map(groups);
  let consecutiveCount = 0;
  let lastInitial = '';
  
  while (result.length < array.length) {
    // Get available initials (those with remaining items)
    const availableInitials = Array.from(availableGroups.keys()).filter(
      initial => availableGroups.get(initial)!.length > 0
    );
    
    if (availableInitials.length === 0) break;
    
    // Filter out current initial if we've used it twice consecutively
    let validInitials = availableInitials;
    if (consecutiveCount >= 2 && availableInitials.length > 1) {
      validInitials = availableInitials.filter(initial => initial !== lastInitial);
    }
    
    // If no valid initials (only one group left), use what's available
    if (validInitials.length === 0) {
      validInitials = availableInitials;
    }
    
    // Pick a random initial from valid ones
    const chosenInitial = validInitials[Math.floor(Math.random() * validInitials.length)];
    const group = availableGroups.get(chosenInitial)!;
    const item = group.shift()!;
    
    result.push(item);
    
    // Update consecutive tracking
    if (chosenInitial === lastInitial) {
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
      lastInitial = chosenInitial;
    }
    
    // Remove empty groups
    if (group.length === 0) {
      availableGroups.delete(chosenInitial);
    }
  }
  
  return result;
}

// Sort by pinyin alphabetically (A-Z)
export function sortByPinyin<T extends { pinyin?: string }>(array: T[]): T[] {
  return [...array].sort((a, b) => {
    const pinyinA = (a.pinyin || '').toLowerCase();
    const pinyinB = (b.pinyin || '').toLowerCase();
    return pinyinA.localeCompare(pinyinB, 'en');
  });
}

export function createGameCards(
  vocabulary: VocabularyItem[],
  mode: GameMode,
  showPinyin: boolean,
  showArabic: boolean = false,
  shuffle: boolean = true
): { chinese: GameCard[]; pinyin: GameCard[]; english: GameCard[]; arabic: GameCard[] } {
  // Sort vocabulary by pinyin when not shuffling
  const sortedVocabulary = shuffle ? vocabulary : sortByPinyin(vocabulary);
  
  const chineseCards: GameCard[] = sortedVocabulary.map(item => ({
    id: `chinese-${item.id}`,
    vocabId: item.id,
    type: 'chinese' as CardType,
    content: item.chinese,
    pinyin: showPinyin ? item.pinyin : undefined,
    isSelected: false,
    isMatched: false,
    isError: false,
  }));

  const englishCards: GameCard[] = sortedVocabulary.map(item => ({
    id: `english-${item.id}`,
    vocabId: item.id,
    type: 'english' as CardType,
    content: item.english,
    isSelected: false,
    isMatched: false,
    isError: false,
  }));

  const pinyinCards: GameCard[] = mode === '3-column' 
    ? sortedVocabulary.map(item => ({
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
    ? sortedVocabulary.filter(item => item.arabic).map(item => ({
        id: `arabic-${item.id}`,
        vocabId: item.id,
        type: 'arabic' as CardType,
        content: item.arabic!,
        isSelected: false,
        isMatched: false,
        isError: false,
      }))
    : [];

  // Smart shuffle cards within each column when shuffle mode is on
  return {
    chinese: shuffle ? smartShuffleByPinyin(chineseCards) : chineseCards,
    pinyin: shuffle ? smartShuffleByPinyin(pinyinCards) : pinyinCards,
    english: shuffle ? smartShuffleByPinyin(englishCards) : englishCards,
    arabic: shuffle ? smartShuffleByPinyin(arabicCards) : arabicCards,
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
