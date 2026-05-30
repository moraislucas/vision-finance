/**
 * Tipos de domínio — derivados manualmente do schema da seção 7.
 * Quando o Supabase estiver linkado, substitua/complemente com:
 *   npm run supabase:types  →  src/types/database.ts
 * e re-exporte os Row types daqui.
 */

export type UUID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string;

export type TransactionType = 'income' | 'expense';
export type AccountType = 'bank' | 'cash';
export type RecurringFrequency = 'monthly' | 'yearly';
export type Theme = 'dark' | 'light' | 'system';

export interface Profile {
  id: UUID;
  household_id: UUID;
  name: string;
  email: string;
  avatar_url: string | null;
  /** Token secreto pro atalho do iPhone (Quick Transaction). NULL = desligado. */
  quick_token: UUID | null;
  created_at: ISODateTime;
}

export interface Account {
  id: UUID;
  household_id: UUID;
  name: string;
  type: AccountType;
  initial_balance: number;
  include_in_available: boolean;
  icon: string | null;
  color: string | null;
  created_at: ISODateTime;
}

export interface CreditCard {
  id: UUID;
  household_id: UUID;
  name: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
  active: boolean;
  icon: string | null;
  color: string | null;
  created_at: ISODateTime;
}

export interface Category {
  id: UUID;
  household_id: UUID;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: ISODateTime;
}

export interface Transaction {
  id: UUID;
  household_id: UUID;
  account_id: UUID | null;
  category_id: UUID | null;
  type: TransactionType;
  description: string;
  amount: number;
  date: ISODate;
  notes: string | null;
  recurring_income_id: UUID | null;
  recurring_expense_id: UUID | null;
  credit_card_purchase_id: UUID | null;
  created_at: ISODateTime;
}

export interface RecurringIncome {
  id: UUID;
  household_id: UUID;
  name: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  created_at: ISODateTime;
}

export interface RecurringExpense {
  id: UUID;
  household_id: UUID;
  name: string;
  amount: number;
  due_day: number;
  /** Obrigatório quando frequency='yearly' (1..12); null para mensal. */
  due_month: number | null;
  category_id: UUID | null;
  frequency: RecurringFrequency;
  active: boolean;
  created_at: ISODateTime;
}

export interface CreditCardPurchase {
  id: UUID;
  household_id: UUID;
  credit_card_id: UUID;
  category_id: UUID | null;
  description: string;
  total_amount: number;
  installments: number;
  purchase_date: ISODate;
  created_at: ISODateTime;
}

export interface Goal {
  id: UUID;
  household_id: UUID;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: ISODate | null;
  monthly_contribution: number | null;
  is_emergency: boolean;
  active: boolean;
  icon: string | null;
  color: string | null;
  created_at: ISODateTime;
}

export interface GoalContribution {
  id: UUID;
  household_id: UUID;
  goal_id: UUID;
  amount: number;
  date: ISODate;
  created_at: ISODateTime;
}

export interface Settings {
  household_id: UUID;
  currency: string;
  theme: Theme;
  monthly_budget: number | null;
  /**
   * Margem de poupança garantida (R$). Quando setada, a engine desconta este
   * valor do "Saldo Livre" antes de calcular o Pode Gastar — garante que
   * SEMPRE sobre dinheiro no fim do mês, além das metas.
   */
  monthly_savings_target: number | null;
  /** Conta usada por padrão em lançamentos via atalho rápido (iPhone). */
  default_account_id: UUID | null;
  budget_enabled: boolean;
  created_at: ISODateTime;
}

/** Agregado dos dados crus carregados pela dataStore (seção 11). */
export interface HouseholdData {
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  transactions: Transaction[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  creditCardPurchases: CreditCardPurchase[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  settings: Settings | null;
}
