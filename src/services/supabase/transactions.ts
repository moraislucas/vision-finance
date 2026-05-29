import { supabase } from './index';
import type { Transaction, UUID } from '@/types/domain';

export type NewTransaction = Omit<Transaction, 'id' | 'created_at'>;
export type TransactionPatch = Partial<Omit<Transaction, 'id' | 'household_id' | 'created_at'>>;

export async function listTransactions(householdId: UUID): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', householdId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function createTransaction(payload: NewTransaction): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').insert(payload).select('*').single();
  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(id: UUID, patch: TransactionPatch): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Transaction;
}

export async function removeTransaction(id: UUID): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
