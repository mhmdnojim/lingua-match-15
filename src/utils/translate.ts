import { supabase } from '@/integrations/supabase/client';
import { getLanguage } from './languages';

/** Human readable description of a target column for the AI prompt */
export function targetDescription(code: string): string {
  const lang = getLanguage(code);
  if (lang.romanizationOf) {
    const parent = getLanguage(lang.romanizationOf);
    return `${lang.name} (the ${lang.name} romanization of the ${parent.name} word, with tone marks or diacritics where they exist)`;
  }
  return lang.name;
}

export interface TranslateRequest {
  sourceLang: string;
  targetLang: string;
  words: string[];
  instruction?: string;
}

export async function translateWords({
  sourceLang,
  targetLang,
  words,
  instruction,
}: TranslateRequest): Promise<string[]> {
  if (words.length === 0) return [];

  const { data, error } = await supabase.functions.invoke('translate-vocabulary', {
    body: {
      sourceLanguage: getLanguage(sourceLang).name,
      targetLanguage: targetDescription(targetLang),
      words,
      instruction,
    },
  });

  if (error) {
    const details = 'context' in error && (error as any).context ? await (error as any).context.text() : error.message;
    console.error('translate-vocabulary failed:', details);
    throw new Error(typeof details === 'string' && details.length < 300 ? details : 'Translation failed');
  }

  const translations = (data as { translations?: string[] })?.translations;
  if (!Array.isArray(translations)) throw new Error('Translation service returned an unexpected response');

  return words.map((_, i) => String(translations[i] ?? '').trim());
}
