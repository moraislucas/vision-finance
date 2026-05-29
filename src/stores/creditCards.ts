import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as svc from '@/services/supabase/creditCards';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { CreditCard, CreditCardPurchase, UUID } from '@/types/domain';

export const useCreditCardStore = defineStore('creditCards', () => {
  const data = useDataStore();
  const auth = useAuthStore();
  const saving = ref(false);

  async function create(payload: Omit<svc.NewCreditCard, 'household_id'>): Promise<CreditCard> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createCreditCard({ ...payload, household_id: auth.householdId });
      data.upsertById(data.creditCards, created);
      return created;
    } finally {
      saving.value = false;
    }
  }
  async function update(id: UUID, patch: svc.CreditCardPatch): Promise<CreditCard> {
    saving.value = true;
    try {
      const updated = await svc.updateCreditCard(id, patch);
      data.upsertById(data.creditCards, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }
  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeCreditCard(id);
      data.removeById(data.creditCards, id);
      // Compras vinculadas caem com ON DELETE CASCADE.
      const remaining = data.creditCardPurchases.filter((p) => p.credit_card_id !== id);
      data.creditCardPurchases.splice(0, data.creditCardPurchases.length, ...remaining);
    } finally {
      saving.value = false;
    }
  }

  async function createPurchase(
    payload: Omit<svc.NewCreditCardPurchase, 'household_id'>,
  ): Promise<CreditCardPurchase> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createCreditCardPurchase({
        ...payload,
        household_id: auth.householdId,
      });
      data.upsertById(data.creditCardPurchases, created);
      return created;
    } finally {
      saving.value = false;
    }
  }
  async function updatePurchase(id: UUID, patch: svc.CreditCardPurchasePatch): Promise<CreditCardPurchase> {
    saving.value = true;
    try {
      const updated = await svc.updateCreditCardPurchase(id, patch);
      data.upsertById(data.creditCardPurchases, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }
  async function removePurchase(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeCreditCardPurchase(id);
      data.removeById(data.creditCardPurchases, id);
    } finally {
      saving.value = false;
    }
  }

  return { saving, create, update, remove, createPurchase, updatePurchase, removePurchase };
});
