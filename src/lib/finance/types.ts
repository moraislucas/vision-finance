/**
 * Tipos de entrada da Engine — espelho mínimo do domínio.
 *
 * A Engine É PURA: não importa nada do Supabase nem do Pinia. Todos os tipos
 * aqui são apenas o shape esperado nos arrays crus que a dataStore passa.
 */
import type {
  Account,
  Category,
  CreditCard,
  CreditCardPurchase,
  Goal,
  GoalContribution,
  RecurringExpense,
  RecurringIncome,
  Transaction,
} from '@/types/domain';

/** Snapshot dos dados que a Engine consome. */
export interface EngineData {
  accounts: Account[];
  transactions: Transaction[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  creditCards: CreditCard[];
  creditCardPurchases: CreditCardPurchase[];
  /** Opcional para a Engine, mas útil em insights/resolvers. dataStore sempre injeta. */
  categories?: Category[];
}

/** Opções globais de cálculo. */
export interface EngineOptions {
  /** Inclui média móvel de gastos variáveis na projeção (default seção 19: true). */
  includeAvgVar?: boolean;
  /** Janela do gasto médio em meses (default seção 19: 3). */
  avgVarWindowMonths?: number;
}

/** Faixa textual do score financeiro (seção 9.7). */
export type ScoreBand = 'excellent' | 'good' | 'attention' | 'critical';

export interface FinancialScore {
  total: number; // 0..100
  band: ScoreBand;
  breakdown: {
    emergencyReserve: number;
    spendsLessThanEarns: number;
    goalsOnTrack: number;
    lowCardUsage: number;
    projectionPositive: number;
  };
}

export interface ProjectionPoint {
  /** Ano-mês no formato YYYY-MM. */
  month: string;
  /** Saldo projetado ao fim deste mês. */
  balance: number;
  /** True se balance < 0 — alerta visual. */
  negative: boolean;
}

export interface InvoiceLine {
  purchaseId: string;
  description: string;
  installment: number; // 1-based para UI
  totalInstallments: number;
  amount: number;
  dueDate: string; // ISO
}

export interface Invoice {
  cardId: string;
  month: string; // YYYY-MM
  total: number;
  lines: InvoiceLine[];
}
