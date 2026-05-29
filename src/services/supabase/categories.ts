import { supabase } from './index';
import type { Category, UUID } from '@/types/domain';

export type NewCategory = Omit<Category, 'id' | 'created_at'>;
export type CategoryPatch = Partial<Omit<Category, 'id' | 'household_id' | 'created_at'>>;

export async function listCategories(householdId: UUID): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(payload: NewCategory): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: UUID, patch: CategoryPatch): Promise<Category> {
  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Category;
}

export async function removeCategory(id: UUID): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
