import { supabase } from './index';
import type { Settings, UUID } from '@/types/domain';

export type SettingsPatch = Partial<Omit<Settings, 'household_id' | 'created_at'>>;

export async function getSettings(householdId: UUID): Promise<Settings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw error;
  return (data as Settings | null) ?? null;
}

export async function upsertSettings(householdId: UUID, patch: SettingsPatch): Promise<Settings> {
  // `settings` é criado pelo trigger `households_bootstrap`; aqui sempre fazemos update.
  const { data, error } = await supabase
    .from('settings')
    .update(patch)
    .eq('household_id', householdId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Settings;
}
