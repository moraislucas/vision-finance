import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as svc from '@/services/supabase/goals';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { Goal, GoalContribution, UUID } from '@/types/domain';

export const useGoalStore = defineStore('goals', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  /** Recalcula localmente o current_amount somando as contribuições — espelha o trigger. */
  function recomputeCurrentAmount(goalId: UUID): void {
    const goal = data.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const sum = data.goalContributions
      .filter((gc) => gc.goal_id === goalId)
      .reduce((s, gc) => s + Number(gc.amount), 0);
    if (Math.abs(Number(goal.current_amount) - sum) < 0.005) return;
    data.upsertById(data.goals, { ...goal, current_amount: sum });
  }

  async function createGoal(payload: Omit<svc.NewGoal, 'household_id'>): Promise<Goal> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createGoal({ ...payload, household_id: auth.householdId });
      data.upsertById(data.goals, created);
      return created;
    } finally {
      saving.value = false;
    }
  }

  async function updateGoal(id: UUID, patch: svc.GoalPatch): Promise<Goal> {
    saving.value = true;
    try {
      const updated = await svc.updateGoal(id, patch);
      data.upsertById(data.goals, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }

  async function removeGoal(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeGoal(id);
      data.removeById(data.goals, id);
      // Remove contribuições locais associadas (ON DELETE CASCADE no banco).
      const remaining = data.goalContributions.filter((gc) => gc.goal_id !== id);
      data.goalContributions.splice(0, data.goalContributions.length, ...remaining);
    } finally {
      saving.value = false;
    }
  }

  async function addContribution(goalId: UUID, amount: number, date: string): Promise<GoalContribution> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createGoalContribution({
        household_id: auth.householdId,
        goal_id: goalId,
        amount,
        date,
      });
      data.upsertById(data.goalContributions, created);
      recomputeCurrentAmount(goalId);
      return created;
    } finally {
      saving.value = false;
    }
  }

  async function removeContribution(id: UUID): Promise<void> {
    const target = data.goalContributions.find((gc) => gc.id === id);
    saving.value = true;
    try {
      await svc.removeGoalContribution(id);
      data.removeById(data.goalContributions, id);
      if (target) recomputeCurrentAmount(target.goal_id);
    } finally {
      saving.value = false;
    }
  }

  return { saving, createGoal, updateGoal, removeGoal, addContribution, removeContribution };
});
