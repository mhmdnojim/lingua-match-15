import { VocabularyItem } from './excelParser';
import { getLanguage, romanizationCodeFor } from './languages';

export interface ColumnConfig {
  /** language code — also the column id */
  lang: string;
  visible: boolean;
  muted: boolean;
  /** show romanization (pinyin / romaji ...) above the word */
  showRomanization: boolean;
  /** overrides the default position-based card color (index into COLUMN_STYLES) */
  colorIndex?: number;
  /** overrides the global font size for this column only */
  fontSize?: 'small' | 'medium' | 'large' | 'x-large';
}

export interface GameCard {
  id: string;
  vocabId: string;
  lang: string;
  content: string;
  romanization?: string;
  /** grammatical class of the underlying word (noun, verb, …) */
  pos?: string;
  isSelected: boolean;
  isMatched: boolean;
  isError: boolean;
}

/** Random source: returns a float in [0, 1). Defaults to Math.random */
export type RandomFn = () => number;

/** Deterministic PRNG (mulberry32) — same seed always yields the same sequence */
export function createSeededRandom(seed: string): RandomFn {
  // xfnv1a string hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local calendar day key (YYYY-MM-DD) used to keep a daily sequence stable */
export function todayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Seed string for Daily Mode — stable for the whole day and per dataset/scope */
export function dailySeed(...parts: (string | number)[]): string {
  return [todayKey(), ...parts].join('|');
}

export function shuffleArray<T>(array: T[], rand: RandomFn = Math.random): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function firstLetter(text: string): string {
  return (text || '').toLowerCase().trim().charAt(0) || '';
}

/** Shuffle with at most 2 consecutive items sharing the same initial letter */
export function smartShuffle<T>(array: T[], keyOf: (item: T) => string, rand: RandomFn = Math.random): T[] {
  if (array.length <= 2) return shuffleArray(array, rand);

  const groups = new Map<string, T[]>();
  array.forEach(item => {
    const initial = firstLetter(keyOf(item));
    if (!groups.has(initial)) groups.set(initial, []);
    groups.get(initial)!.push(item);
  });
  groups.forEach((items, key) => groups.set(key, shuffleArray(items, rand)));

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

    const chosen = valid[Math.floor(rand() * valid.length)];
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

/** Shuffle the whole dataset so the batches themselves contain different groupings */
export function shuffleVocabulary(
  items: VocabularyItem[],
  mainLang: string,
  rand: RandomFn = Math.random,
): VocabularyItem[] {
  return smartShuffle(items, item => sortKey(item, mainLang), rand);
}

export function createColumnCards(
  items: VocabularyItem[],
  columns: ColumnConfig[],
  shuffle: boolean,
  /** When set, dealing is deterministic — the same seed always deals the same board */
  seed?: string,
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
        pos: item.pos,
        isSelected: false,
        isMatched: false,
        isError: false,
      }))
      .filter(card => card.content.length > 0);

    const rand = seed ? createSeededRandom(`${seed}|${column.lang}`) : Math.random;
    result[column.lang] = shuffle
      ? smartShuffle(cards, card => card.romanization || card.content, rand)
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
