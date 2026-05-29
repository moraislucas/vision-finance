/**
 * dataStore — única fonte da verdade do household (seção 5, 11, 16).
 *
 * Carrega TODOS os dados crus uma vez (após login) e os mantém reativos. Todas
 * as outras stores expõem getters que chamam `src/lib/finance` sobre estes
 * arrays — nenhuma fórmula vive aqui.
 *
 * Mutações (insert/update/delete) feitas via actions: persistem no Supabase E
 * atualizam o array local. Assim toda tela recalcula sem refresh manual.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Account,
  Category,
  CreditCard,
  CreditCardPurchase,
  Goal,
  GoalContribution,
  HouseholdData,
  RecurringExpense,
  RecurringIncome,
  Settings,
  Transaction,
} from '@/types/domain';
import { useAuthStore } from './auth';
import * as accountsSvc from '@/services/supabase/accounts';
import * as categoriesSvc from '@/services/supabase/categories';
import * as transactionsSvc from '@/services/supabase/transactions';
import * as recurringSvc from '@/services/supabase/recurring';
import * as cardsSvc from '@/services/supabase/creditCards';
import * as goalsSvc from '@/services/supabase/goals';
import * as settingsSvc from '@/services/supabase/settings';

export const useDataStore = defineStore('data', () => {
  // --- Arrays crus reativos ---------------------------------------------------
  const accounts = ref<Account[]>([]);
  const creditCards = ref<CreditCard[]>([]);
  const categories = ref<Category[]>([]);
  const transactions = ref<Transaction[]>([]);
  const recurringIncomes = ref<RecurringIncome[]>([]);
  const recurringExpenses = ref<RecurringExpense[]>([]);
  const creditCardPurchases = ref<CreditCardPurchase[]>([]);
  const goals = ref<Goal[]>([]);
  const goalContributions = ref<GoalContribution[]>([]);
  const settings = ref<Settings | null>(null);

  const loading = ref(false);
  const loaded = ref(false);
  const lastError = ref<Error | null>(null);

  const all = computed<HouseholdData>(() => ({
    accounts: accounts.value,
    creditCards: creditCards.value,
    categories: categories.value,
    transactions: transactions.value,
    recurringIncomes: recurringIncomes.value,
    recurringExpenses: recurringExpenses.value,
    creditCardPurchases: creditCardPurchases.value,
    goals: goals.value,
    goalContributions: goalContributions.value,
    settings: settings.value,
  }));

  /** Snapshot consumido pela Engine — exclui settings (não é entrada de cálculo). */
  const engineData = computed(() => ({
    accounts: accounts.value,
    transactions: transactions.value,
    recurringIncomes: recurringIncomes.value,
    recurringExpenses: recurringExpenses.value,
    goals: goals.value,
    goalContributions: goalContributions.value,
    creditCards: creditCards.value,
    creditCardPurchases: creditCardPurchases.value,
    categories: categories.value,
  }));

  function reset(): void {
    accounts.value = [];
    creditCards.value = [];
    categories.value = [];
    transactions.value = [];
    recurringIncomes.value = [];
    recurringExpenses.value = [];
    creditCardPurchases.value = [];
    goals.value = [];
    goalContributions.value = [];
    settings.value = null;
    loaded.value = false;
    lastError.value = null;
  }

  /** Carrega tudo em paralelo. Idempotente: chamar de novo só refresha. */
  async function loadAll(): Promise<void> {
    const auth = useAuthStore();
    const hid = auth.householdId;
    if (!hid) return;
    loading.value = true;
    lastError.value = null;
    try {
      const [accs, cards, cats, txs, ris, res, purchases, gs, gcs, st] = await Promise.all([
        accountsSvc.listAccounts(hid),
        cardsSvc.listCreditCards(hid),
        categoriesSvc.listCategories(hid),
        transactionsSvc.listTransactions(hid),
        recurringSvc.listRecurringIncomes(hid),
        recurringSvc.listRecurringExpenses(hid),
        cardsSvc.listCreditCardPurchases(hid),
        goalsSvc.listGoals(hid),
        goalsSvc.listGoalContributions(hid),
        settingsSvc.getSettings(hid),
      ]);
      accounts.value = accs;
      creditCards.value = cards;
      categories.value = cats;
      transactions.value = txs;
      recurringIncomes.value = ris;
      recurringExpenses.value = res;
      creditCardPurchases.value = purchases;
      goals.value = gs;
      goalContributions.value = gcs;
      settings.value = st;
      loaded.value = true;
    } catch (err) {
      lastError.value = err instanceof Error ? err : new Error(String(err));
      throw lastError.value;
    } finally {
      loading.value = false;
    }
  }

  /** Alias semântico — futuro hook de realtime do Supabase pode mapear aqui. */
  async function refresh(): Promise<void> {
    await loadAll();
  }

  // --- Helpers de mutação local (idempotentes por id) ------------------------
  //
  // IMPORTANTE: as actions chamam estes passando o ARRAY (`data.transactions`,
  // não `{ value: data.transactions }`). Mutamos in-place com `splice`/`unshift`
  // para que o proxy reativo do Pinia/Vue rastreie a mudança — atribuir uma
  // nova lista a uma propriedade de um objeto literal NÃO reativa nada.
  function upsertById<T extends { id: string }>(arr: T[], item: T): void {
    const idx = arr.findIndex((x) => x.id === item.id);
    if (idx === -1) arr.unshift(item);
    else arr.splice(idx, 1, item);
  }
  function removeById<T extends { id: string }>(arr: T[], id: string): void {
    const idx = arr.findIndex((x) => x.id === id);
    if (idx !== -1) arr.splice(idx, 1);
  }

  return {
    // estado
    accounts,
    creditCards,
    categories,
    transactions,
    recurringIncomes,
    recurringExpenses,
    creditCardPurchases,
    goals,
    goalContributions,
    settings,
    loading,
    loaded,
    lastError,
    all,
    engineData,
    // ações
    loadAll,
    refresh,
    reset,
    upsertById,
    removeById,
  };
});
