import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as svc from '@/services/supabase/settings';
import { useDataStore } from './data';
import { useAuthStore } from './auth';

export const useSettingsStore = defineStore('settings', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  async function update(patch: svc.SettingsPatch) {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const updated = await svc.upsertSettings(auth.householdId, patch);
      data.settings = updated;
      return updated;
    } finally {
      saving.value = false;
    }
  }

  return { saving, update };
});
