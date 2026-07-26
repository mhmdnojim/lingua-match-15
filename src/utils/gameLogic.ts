import { VocabularyItem } from './excelParser';
import { getLanguage, romanizationCodeFor } from './languages';

export interface ColumnConfig {
  /** language code — also the column id */
  lang: string;
  visible: boolean;
  muted: boolean;
  /** show romanization (pinyin / romaji ...) above the word */
  showRomanization: boolean;
}

export interface GameCard {
  id: string;
  vocabId: string;
  lang: string;
  content: string;
  romanization?: string;
  isSelected: boolean;
  isMatched: boolean;
  isError: boolean;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function firstLetter(text: string): string {
  return (text || '').toLowerCase().trim().charAt(0) || '';
}

/** Shuffle with at most 2 consecutive items sharing the same initial letter */
export function smartShuffle<T>(array: T[], keyOf: (item: T) => string): T[] {
  if (array.length <= 2) return shuffleArray(array);

  const groups = new Map<string, T[]>();
  array.forEach(item => {
    const initial = firstLetter(keyOf(item));
    if (!groups.has(initial)) groups.set(initial, []);
    groups.get(initial)!.push(item);
  });
  groups.forEach((items, key) => groups.set(key, shuffleArray(items)));

  const result: T[] = [];
  const available = new Map(groups);
  let consecutive = 0;
  let lastInitial = '';

  while (result.length < array.length) {
    const initials = Array.from(available.keys()).filter(k => available.get(k)!.length > 0);
    if (initials.length === 0) break;

    let valid = initials;
    if (consecutive >= 2 && initials.length > 1) {
      valid = initials.filter(k => k !== lastInitial);
    }
    if (valid.length === 0) valid = initials;

    const chosen = valid[Math.floor(Math.random() * valid.length)];
    const group = available.get(chosen)!;
    result.push(group.shift()!);

    if (chosen === lastInitial) {
      consecutive++;
    } else {
      consecutive = 1;
      lastInitial = chosen;
    }
    if (group.length === 0) available.delete(chosen);
  }

  return result;
}

/** Value shown for a language: romanization pseudo-languages read their own key */
export function valueFor(item: VocabularyItem, lang: string): string {
  return item.values[lang] || '';
}

export function romanizationFor(item: VocabularyItem, lang: string): string | undefined {
  const romCode = romanizationCodeFor(lang);
  return romCode ? item.values[romCode] || undefined : undefined;
}

/** Sort key used for alphabetical (Order) mode — prefers romanization when available */
function sortKey(item: VocabularyItem, lang: string): string {
  return (romanizationFor(item, lang) || valueFor(item, lang) || '').toLowerCase();
}

export function sortVocabulary(items: VocabularyItem[], mainLang: string): VocabularyItem[] {
  return [...items].sort((a, b) => sortKey(a, mainLang).localeCompare(sortKey(b, mainLang), 'en'));
}

export function createColumnCards(
  items: VocabularyItem[],
  columns: ColumnConfig[],
  shuffle: boolean,
): Record<string, GameCard[]> {
  const result: Record<string, GameCard[]> = {};

  columns.forEach(column => {
    const cards: GameCard[] = items
      .map(item => ({
        id: `${column.lang}-${item.id}`,
        vocabId: item.id,
        lang: column.lang,
        content: valueFor(item, column.lang),
        romanization: romanizationFor(item, column.lang),
        isSelected: false,
        isMatched: false,
        isError: false,
      }))
      .filter(card => card.content.length > 0);

    result[column.lang] = shuffle
      ? smartShuffle(cards, card => card.romanization || card.content)
      : cards;
  });

  return result;
}

export function languageLabel(lang: string): string {
  const def = getLanguage(lang);
  return def.native === def.name ? def.name : `${def.native} ${def.name.toUpperCase()}`;
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
