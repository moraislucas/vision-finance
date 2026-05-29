import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as svc from '@/services/supabase/recurring';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { RecurringExpense, RecurringIncome, UUID } from '@/types/domain';

export const useRecurringIncomeStore = defineStore('recurringIncomes', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  async function create(payload: Omit<svc.NewRecurringIncome, 'household_id'>): Promise<RecurringIncome> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createRecurringIncome({ ...payload, household_id: auth.householdId });
      data.upsertById(data.recurringIncomes, created);
      return created;
    } finally {
      saving.value = false;
    }
  }
  async function update(id: UUID, patch: svc.RecurringIncomePatch): Promise<RecurringIncome> {
    saving.value = true;
    try {
      const updated = await svc.updateRecurringIncome(id, patch);
      data.upsertById(data.recurringIncomes, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }
  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeRecurringIncome(id);
      data.removeById(data.recurringIncomes, id);
    } finally {
      saving.value = false;
    }
  }
  return { saving, create, update, remove };
});

export const useRecurringExpenseStore = defineStore('recurringExpenses', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  async function create(payload: Omit<svc.NewRecurringExpense, 'household_id'>): Promise<RecurringExpense> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createRecurringExpense({ ...payload, household_id: auth.householdId });
      data.upsertById(data.recurringExpenses, created);
      return created;
    } finally {
      saving.value = false;
    }
  }
  async function update(id: UUID, patch: svc.RecurringExpensePatch): Promise<RecurringExpense> {
    saving.value = true;
    try {
      const updated = await svc.updateRecurringExpense(id, patch);
      data.upsertById(data.recurringExpenses, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }
  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeRecurringExpense(id);
      data.removeById(data.recurringExpenses, id);
    } finally {
      saving.value = false;
    }
  }
  return { saving, create, update, remove };
});
