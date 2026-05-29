import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as svc from '@/services/supabase/accounts';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { Account, UUID } from '@/types/domain';

export const useAccountStore = defineStore('accounts', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  async function create(payload: Omit<svc.NewAccount, 'household_id'>): Promise<Account> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createAccount({ ...payload, household_id: auth.householdId });
      data.upsertById(data.accounts, created);
      return created;
    } finally {
      saving.value = false;
    }
  }

  async function update(id: UUID, patch: svc.AccountPatch): Promise<Account> {
    saving.value = true;
    try {
      const updated = await svc.updateAccount(id, patch);
      data.upsertById(data.accounts, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }

  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeAccount(id);
      data.removeById(data.accounts, id);
    } finally {
      saving.value = false;
    }
  }

  return { saving, create, update, remove };
});
