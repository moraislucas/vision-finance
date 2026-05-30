/**
 * Fábricas mínimas para construir snapshots de `EngineData` em testes — todos
 * os campos opcionais ganham default neutro para focar no que importa em cada caso.
 */
import { dayjs } from '@/lib/helpers/date';
import type {
  Account,
  Category,
  CreditCard,
  CreditCardPurchase,
  Goal,
  GoalContribution,
  RecurringExpense,
  RecurringIncome,
  Settings,
  Transaction,
} from '@/types/domain';
import type { EngineData } from '../types';

const HOUSEHOLD = 'household-test';

let counter = 0;
const id = (prefix = 'id') => `${prefix}-${++counter}`;
const now = () => dayjs().toISOString();

export function makeAccount(over: Partial<Account> = {}): Account {
  return {
    id: id('acc'),
    household_id: HOUSEHOLD,
    name: 'Conta',
    type: 'bank',
    initial_balance: 0,
    include_in_available: true,
    icon: null,
    color: null,
    created_at: now(),
    ...over,
  };
}

export function makeCategory(over: Partial<Category> = {}): Category {
  return {
    id: id('cat'),
    household_id: HOUSEHOLD,
    name: 'Cat',
    type: 'expense',
    icon: null,
    color: null,
    is_default: false,
    created_at: now(),
    ...over,
  };
}

export function makeTransaction(over: Partial<Transaction> = {}): Transaction {
  return {
    id: id('tx'),
    household_id: HOUSEHOLD,
    account_id: null,
    category_id: null,
    type: 'expense',
    description: 'tx',
    amount: 0,
    date: dayjs().format('YYYY-MM-DD'),
    notes: null,
    recurring_income_id: null,
    recurring_expense_id: null,
    credit_card_purchase_id: null,
    created_at: now(),
    ...over,
  };
}

export function makeRecurringIncome(over: Partial<RecurringIncome> = {}): RecurringIncome {
  return {
    id: id('ri'),
    household_id: HOUSEHOLD,
    name: 'Salário',
    amount: 0,
    day_of_month: 5,
    active: true,
    created_at: now(),
    ...over,
  };
}

export function makeRecurringExpense(over: Partial<RecurringExpense> = {}): RecurringExpense {
  const base: RecurringExpense = {
    id: id('re'),
    household_id: HOUSEHOLD,
    name: 'Aluguel',
    amount: 0,
    due_day: 10,
    due_month: null,
    category_id: null,
    frequency: 'monthly',
    active: true,
    created_at: now(),
  };
  return { ...base, ...over };
}

export function makeCreditCard(over: Partial<CreditCard> = {}): CreditCard {
  return {
    id: id('card'),
    household_id: HOUSEHOLD,
    name: 'Cartão',
    limit_amount: 5000,
    closing_day: 25,
    due_day: 5,
    active: true,
    icon: null,
    color: null,
    created_at: now(),
    ...over,
  };
}

export function makePurchase(over: Partial<CreditCardPurchase> = {}): CreditCardPurchase {
  return {
    id: id('purchase'),
    household_id: HOUSEHOLD,
    credit_card_id: 'card-?',
    category_id: null,
    description: 'Compra',
    total_amount: 0,
    installments: 1,
    purchase_date: dayjs().format('YYYY-MM-DD'),
    created_at: now(),
    ...over,
  };
}

export function makeGoal(over: Partial<Goal> = {}): Goal {
  return {
    id: id('goal'),
    household_id: HOUSEHOLD,
    name: 'Meta',
    target_amount: 0,
    current_amount: 0,
    target_date: null,
    monthly_contribution: null,
    is_emergency: false,
    active: true,
    icon: null,
    color: null,
    created_at: now(),
    ...over,
  };
}

export function makeGoalContribution(over: Partial<GoalContribution> = {}): GoalContribution {
  return {
    id: id('gc'),
    household_id: HOUSEHOLD,
    goal_id: 'goal-?',
    amount: 0,
    date: dayjs().format('YYYY-MM-DD'),
    created_at: now(),
    ...over,
  };
}

export function makeSettings(over: Partial<Settings> = {}): Settings {
  return {
    household_id: HOUSEHOLD,
    currency: 'BRL',
    theme: 'dark',
    monthly_budget: null,
    monthly_savings_target: null,
    default_account_id: null,
    budget_enabled: true,
    created_at: now(),
    ...over,
  };
}

export function emptyEngineData(): EngineData {
  return {
    accounts: [],
    transactions: [],
    recurringIncomes: [],
    recurringExpenses: [],
    goals: [],
    goalContributions: [],
    creditCards: [],
    creditCardPurchases: [],
  };
}
