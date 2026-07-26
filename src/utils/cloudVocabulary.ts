import { supabase } from '@/integrations/supabase/client';
import { VocabularyItem } from './excelParser';
import { ColumnConfig } from './gameLogic';

export interface CloudSet {
  source: string;
  mainLang: string;
  columns: ColumnConfig[];
  items: VocabularyItem[];
  updatedAt: string;
}

/** How many translated cells a set contains — used to pick the richer copy */
export function filledCount(items: VocabularyItem[]): number {
  return items.reduce(
    (sum, item) => sum + Object.values(item.values || {}).filter(v => String(v || '').trim()).length,
    0,
  );
}

export async function fetchCloudSet(source: string): Promise<CloudSet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('vocabulary_sets')
    .select('source, main_lang, columns, items, updated_at')
    .eq('user_id', user.id)
    .eq('source', source)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load cloud vocabulary:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    source: data.source,
    mainLang: data.main_lang,
    columns: (data.columns as unknown as ColumnConfig[]) || [],
    items: (data.items as unknown as VocabularyItem[]) || [],
    updatedAt: data.updated_at,
  };
}

export async function listCloudSets(): Promise<{ source: string; words: number; updatedAt: string }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vocabulary_sets')
    .select('source, items, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data.map(row => ({
    source: row.source,
    words: ((row.items as unknown as VocabularyItem[]) || []).length,
    updatedAt: row.updated_at,
  }));
}

export async function saveCloudSet(set: Omit<CloudSet, 'updatedAt'>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  if (set.items.length === 0) return false;

  const { error } = await supabase
    .from('vocabulary_sets')
    .upsert(
      {
        user_id: user.id,
        source: set.source,
        main_lang: set.mainLang,
        columns: set.columns as unknown as never,
        items: set.items as unknown as never,
      },
      { onConflict: 'user_id,source' },
    );

  if (error) {
    console.warn('Failed to save cloud vocabulary:', error.message);
    return false;
  }
  return true;
}

export async function deleteCloudSet(source: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('vocabulary_sets')
    .delete()
    .eq('user_id', user.id)
    .eq('source', source);

  if (error) {
    console.warn('Failed to delete cloud vocabulary:', error.message);
    return false;
  }
  return true;
}
