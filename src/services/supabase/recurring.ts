import { supabase } from './index';
import type { RecurringExpense, RecurringIncome, UUID } from '@/types/domain';

// --- Receitas recorrentes ----------------------------------------------------

export type NewRecurringIncome = Omit<RecurringIncome, 'id' | 'created_at'>;
export type RecurringIncomePatch = Partial<Omit<RecurringIncome, 'id' | 'household_id' | 'created_at'>>;

export async function listRecurringIncomes(householdId: UUID): Promise<RecurringIncome[]> {
  const { data, error } = await supabase
    .from('recurring_incomes')
    .select('*')
    .eq('household_id', householdId)
    .order('day_of_month', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RecurringIncome[];
}

export async function createRecurringIncome(payload: NewRecurringIncome): Promise<RecurringIncome> {
  const { data, error } = await supabase.from('recurring_incomes').insert(payload).select('*').single();
  if (error) throw error;
  return data as RecurringIncome;
}

export async function updateRecurringIncome(id: UUID, patch: RecurringIncomePatch): Promise<RecurringIncome> {
  const { data, error } = await supabase
    .from('recurring_incomes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as RecurringIncome;
}

export async function removeRecurringIncome(id: UUID): Promise<void> {
  const { error } = await supabase.from('recurring_incomes').delete().eq('id', id);
  if (error) throw error;
}

// --- Despesas recorrentes ----------------------------------------------------

export type NewRecurringExpense = Omit<RecurringExpense, 'id' | 'created_at'>;
export type RecurringExpensePatch = Partial<Omit<RecurringExpense, 'id' | 'household_id' | 'created_at'>>;

export async function listRecurringExpenses(householdId: UUID): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('household_id', householdId)
    .order('due_day', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RecurringExpense[];
}

export async function createRecurringExpense(payload: NewRecurringExpense): Promise<RecurringExpense> {
  const { data, error } = await supabase.from('recurring_expenses').insert(payload).select('*').single();
  if (error) throw error;
  return data as RecurringExpense;
}

export async function updateRecurringExpense(id: UUID, patch: RecurringExpensePatch): Promise<RecurringExpense> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as RecurringExpense;
}

export async function removeRecurringExpense(id: UUID): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) throw error;
}
