import { supabase } from './index';
import type { Goal, GoalContribution, UUID } from '@/types/domain';

// --- Metas -------------------------------------------------------------------

export type NewGoal = Omit<Goal, 'id' | 'current_amount' | 'created_at'>;
export type GoalPatch = Partial<Omit<Goal, 'id' | 'household_id' | 'created_at' | 'current_amount'>>;

export async function listGoals(householdId: UUID): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(payload: NewGoal): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...payload, current_amount: 0 })
    .select('*')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(id: UUID, patch: GoalPatch): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Goal;
}

export async function removeGoal(id: UUID): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// --- Aportes -----------------------------------------------------------------

export type NewGoalContribution = Omit<GoalContribution, 'id' | 'created_at'>;

export async function listGoalContributions(householdId: UUID): Promise<GoalContribution[]> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('household_id', householdId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GoalContribution[];
}

export async function createGoalContribution(payload: NewGoalContribution): Promise<GoalContribution> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as GoalContribution;
}

export async function removeGoalContribution(id: UUID): Promise<void> {
  const { error } = await supabase.from('goal_contributions').delete().eq('id', id);
  if (error) throw error;
}
