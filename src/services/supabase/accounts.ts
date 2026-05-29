import { supabase } from './index';
import type { Account, UUID } from '@/types/domain';

export type NewAccount = Omit<Account, 'id' | 'created_at'>;
export type AccountPatch = Partial<Omit<Account, 'id' | 'household_id' | 'created_at'>>;

export async function listAccounts(householdId: UUID): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}

export async function createAccount(payload: NewAccount): Promise<Account> {
  const { data, error } = await supabase.from('accounts').insert(payload).select('*').single();
  if (error) throw error;
  return data as Account;
}

export async function updateAccount(id: UUID, patch: AccountPatch): Promise<Account> {
  const { data, error } = await supabase.from('accounts').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Account;
}

export async function removeAccount(id: UUID): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}
