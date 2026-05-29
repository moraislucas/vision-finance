/**
 * transactionStore — CRUD de transações.
 *
 * Padrão das actions: persiste no Supabase via service → atualiza array da
 * dataStore (`upsertById`/`removeById`). Resultado: toda tela que lê
 * `dataStore.transactions` ou getters da Engine recalcula sozinha.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as svc from '@/services/supabase/transactions';
import { useDataStore } from './data';
import { useAuthStore } from './auth';
import type { Transaction, TransactionType, UUID } from '@/types/domain';

export interface TransactionFilters {
  search: string;
  type: TransactionType | 'all';
  categoryId: UUID | 'all';
  accountId: UUID | 'all';
  /** ISO YYYY-MM-DD */
  dateFrom: string | null;
  dateTo: string | null;
}

export const useTransactionStore = defineStore('transactions', () => {
  const data = useDataStore();
  const auth = useAuthStore();

  const filters = ref<TransactionFilters>({
    search: '',
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
    dateFrom: null,
    dateTo: null,
  });
  const saving = ref(false);

  const filtered = computed<Transaction[]>(() => {
    const f = filters.value;
    const search = f.search.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      if (f.type !== 'all' && tx.type !== f.type) return false;
      if (f.categoryId !== 'all' && tx.category_id !== f.categoryId) return false;
      if (f.accountId !== 'all' && tx.account_id !== f.accountId) return false;
      if (f.dateFrom && tx.date < f.dateFrom) return false;
      if (f.dateTo && tx.date > f.dateTo) return false;
      if (search && !tx.description.toLowerCase().includes(search)) return false;
      return true;
    });
  });

  const totals = computed(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered.value) {
      const amt = Number(tx.amount);
      if (tx.type === 'income') income += amt;
      else expense += amt;
    }
    return { count: filtered.value.length, income, expense, net: income - expense };
  });

  async function create(payload: Omit<svc.NewTransaction, 'household_id'>): Promise<Transaction> {
    if (!auth.householdId) throw new Error('Sem household');
    saving.value = true;
    try {
      const created = await svc.createTransaction({ ...payload, household_id: auth.householdId });
      data.upsertById(data.transactions, created);
      return created;
    } finally {
      saving.value = false;
    }
  }

  async function update(id: UUID, patch: svc.TransactionPatch): Promise<Transaction> {
    saving.value = true;
    try {
      const updated = await svc.updateTransaction(id, patch);
      data.upsertById(data.transactions, updated);
      return updated;
    } finally {
      saving.value = false;
    }
  }

  async function remove(id: UUID): Promise<void> {
    saving.value = true;
    try {
      await svc.removeTransaction(id);
      data.removeById(data.transactions, id);
    } finally {
      saving.value = false;
    }
  }

  return { filters, filtered, totals, saving, create, update, remove };
});
