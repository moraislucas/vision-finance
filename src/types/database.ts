/**
 * Stub para os tipos gerados pelo Supabase CLI.
 *
 * Quando você linkar o projeto, gere o real:
 *   npm run supabase:types
 * e substitua este arquivo pelo output. O shape `Row/Insert/Update` é o
 * que `@supabase/supabase-js` espera por tabela.
 */
import type {
  Account,
  Category,
  CreditCard,
  CreditCardPurchase,
  Goal,
  GoalContribution,
  Profile,
  RecurringExpense,
  RecurringIncome,
  Settings,
  Transaction,
} from './domain';

/** Insert: campos auto-gerados ficam opcionais (id, created_at). */
type Insertable<T extends { id: string; created_at: string }> = Omit<T, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
/** Update: tudo opcional. */
type Updatable<T> = Partial<T>;

interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      households: {
        Row: Household;
        Insert: { id?: string; name?: string; created_at?: string };
        Update: Updatable<Household>;
      };
      profiles: {
        Row: Profile;
        Insert: Insertable<Profile>;
        Update: Updatable<Profile>;
      };
      accounts: {
        Row: Account;
        Insert: Insertable<Account>;
        Update: Updatable<Account>;
      };
      credit_cards: {
        Row: CreditCard;
        Insert: Insertable<CreditCard>;
        Update: Updatable<CreditCard>;
      };
      categories: {
        Row: Category;
        Insert: Insertable<Category>;
        Update: Updatable<Category>;
      };
      transactions: {
        Row: Transaction;
        Insert: Insertable<Transaction>;
        Update: Updatable<Transaction>;
      };
      recurring_incomes: {
        Row: RecurringIncome;
        Insert: Insertable<RecurringIncome>;
        Update: Updatable<RecurringIncome>;
      };
      recurring_expenses: {
        Row: RecurringExpense;
        Insert: Insertable<RecurringExpense>;
        Update: Updatable<RecurringExpense>;
      };
      credit_card_purchases: {
        Row: CreditCardPurchase;
        Insert: Insertable<CreditCardPurchase>;
        Update: Updatable<CreditCardPurchase>;
      };
      goals: {
        Row: Goal;
        Insert: Insertable<Goal>;
        Update: Updatable<Goal>;
      };
      goal_contributions: {
        Row: GoalContribution;
        Insert: Insertable<GoalContribution>;
        Update: Updatable<GoalContribution>;
      };
      settings: {
        Row: Settings;
        // settings usa household_id como PK — não é gerado.
        Insert: Omit<Settings, 'created_at'> & { created_at?: string };
        Update: Updatable<Settings>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
