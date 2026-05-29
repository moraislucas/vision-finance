import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as svc from '@/services/supabase/categories';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { Category, UUID } from '@/types/domain';

export const useCategoryStore = defineStore('categories', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  const income = computed(() => data.categories.filter((c) => c.type === 'income'));
  const expense = computed(() => data.categories.filter((c) => c.type === 'expense'));

  async function create(payload: Omit<svc.NewCategory, 'household_id'>): Promise<Category> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createCategory({ ...payload, household_id: auth.householdId });
      data.upsertById(data.categories, created);
      return created;
    } finally {
      saving.value = false;
    }
  }

  async function update(id: UUID, patch: svc.CategoryPatch): Promise<Category> {
    saving.value = true;
    try {
      const updated = await svc.updateCategory(id, patch);
      data.upsertById(data.categories, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }

  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeCategory(id);
      data.removeById(data.categories, id);
    } finally {
      saving.value = false;
    }
  }

  return { income, expense, saving, create, update, remove };
});
