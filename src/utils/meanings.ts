import React from 'react';

/**
 * Multi-meaning support.
 *
 * A translation often carries several meanings in one cell ("bank, shore, embankment").
 * We split those into separate meanings so the flashcard can show only the ones the
 * user picked, while the rest stay available in the meanings panel.
 */

const SEPARATORS = /\s*(?:[,;/|]|、|，|；|؛)\s*/;

/** Split a stored value into its individual meanings (always at least one entry) */
export function splitMeanings(value: string): string[] {
  if (!value) return [];
  const parts = value
    .split(SEPARATORS)
    .map(p => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [value.trim()];
}

export function joinMeanings(meanings: string[]): string {
  return meanings.join(', ');
}

const STORAGE_KEY = 'vocabulary-meaning-selection';

type SelectionStore = Record<string, string[]>;

const read = (): SelectionStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SelectionStore) : {};
  } catch {
    return {};
  }
};

let store: SelectionStore = typeof window === 'undefined' ? {} : read();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function selectionKey(vocabId: string, lang: string): string {
  return `${vocabId}|${lang}`;
}

/** Expressions currently checked for a card (outside React) — first one by default */
export function getMeaningSelection(vocabId: string, lang: string, meanings: string[]): string[] {
  if (meanings.length <= 1) return meanings;
  const kept = (store[selectionKey(vocabId, lang)] ?? []).filter(m => meanings.includes(m));
  return kept.length ? kept : meanings.slice(0, 1);
}


export function setMeaningSelection(vocabId: string, lang: string, meanings: string[]) {
  const key = selectionKey(vocabId, lang);
  store = { ...store, [key]: meanings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage full / unavailable — selection stays in memory */
  }
  emit();
}

const getSnapshot = () => store;
const getServerSnapshot = () => store;

/** Meanings currently chosen for a card, falling back to the first meaning */
export function useMeaningSelection(vocabId: string, lang: string, meanings: string[]) {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saved = state[selectionKey(vocabId, lang)];

  const selected = React.useMemo(() => {
    if (meanings.length <= 1) return meanings;
    const kept = (saved ?? []).filter(m => meanings.includes(m));
    return kept.length ? kept : meanings.slice(0, 1);
  }, [saved, meanings]);

  const setSelected = React.useCallback(
    (next: string[]) => setMeaningSelection(vocabId, lang, next),
    [vocabId, lang],
  );

  return { selected, setSelected };
}
