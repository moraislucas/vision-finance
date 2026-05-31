/**
 * Saldo Projetado, Saldo Livre e Pode Gastar (seção 9.5 do contexto).
 *
 *   SaldoProjetadoFimMes = B0 + Ir − Or − Cr
 *   SaldoLivreMes        = SaldoProjetadoFimMes − R = (B0−R) + Ir − Or − Cr
 *
 * Extensão (não estava no contexto original): MARGEM DE POUPANÇA garantida.
 * Quando o usuário define `monthly_savings_target > 0` nas settings, a engine
 * desconta esse valor antes de calcular o Pode Gastar — assim SEMPRE sobra
 * dinheiro no fim do mês, mesmo sem meta explícita.
 *
 *   SafetyBuffer         = min(monthly_savings_target, SaldoLivreMes)
 *   PodeGastarMes        = max(0, SaldoLivreMes − SafetyBuffer)
 *   PodeGastarDia        = PodeGastarMes / diasRestantes
 *   PodeGastarSemana     = PodeGastarDia × min(7, diasRestantes)
 *
 * Quando `monthly_savings_target = 0` (ou null), o comportamento é IDÊNTICO ao
 * da seção 9.5. Os testes do worked example continuam válidos.
 */
import {
  remainingDaysInMonth,
  today as todayHelper,
  type Dayjs,
} from '@/lib/helpers/date';
import type { Transaction } from '@/types/domain';
import type { EngineData } from './types';
import { getCurrentBalance, getReserved } from './balance';
import { getRemainingIncome, getRemainingRecurringExpenses } from './recurring';
import { getRemainingCardInvoices } from './credit-cards';
import { getRemainingGoalContributions } from './goals';

export interface BudgetOptions {
  /**
   * Margem de poupança automática em R$. Quando > 0, é descontada do saldo
   * livre antes de calcular o Pode Gastar (garante poupança mensal).
   * Default 0 = sem margem (comportamento da seção 9.5).
   */
  savingsBuffer?: number;
}

export interface BudgetBreakdown {
  B0: number;
  R: number;
  Ir: number;
  Or: number;
  Cr: number;
  availableNow: number;
  projectedMonthEnd: number;
  freeBalanceMonth: number;
  /** Quanto da `savingsBuffer` cabe no saldo livre. min(target, freeBalance). */
  savingsApplied: number;
  /** Valor configurado (target). */
  savingsTarget: number;
  /** True quando o saldo livre é menor que o target → "mês apertado". */
  savingsShortfall: boolean;
  daysRemaining: number;
  monthlyBudget: number;
  weeklyBudget: number;
  dailyBudget: number;
}

/**
 * Quanto de gasto VARIÁVEL (discricionário) já foi lançado numa data.
 * Exclui despesas vinculadas a conta fixa (`recurring_expense_id`) e a compras
 * de cartão (`credit_card_purchase_id`) — é a mesma definição usada na projeção
 * diária. Base do "já gastei hoje" que esvazia o teto diário.
 */
export function getDiscretionarySpentOnDate(
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): number {
  const refStr = ref.format('YYYY-MM-DD');
  let sum = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (tx.date !== refStr) continue;
    if (tx.recurring_expense_id || tx.credit_card_purchase_id) continue;
    sum += Number(tx.amount);
  }
  return round2(sum);
}

/** Or completo = contas fixas restantes + faturas a vencer não pagas. */
export function getRemainingObligations(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
): number {
  return round2(
    getRemainingRecurringExpenses(data.recurringExpenses, data.transactions, ref) +
      getRemainingCardInvoices(
        data.creditCards,
        data.creditCardPurchases,
        data.transactions,
        paymentCategoryId,
        ref,
      ),
  );
}

export function getProjectedMonthEndBalance(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
): number {
  const B0 = getCurrentBalance(data.accounts, data.transactions, ref);
  const Ir = getRemainingIncome(data.recurringIncomes, data.transactions, ref);
  const Or = getRemainingObligations(data, paymentCategoryId, ref);
  const Cr = getRemainingGoalContributions(data.goals, data.goalContributions, ref);
  return round2(B0 + Ir - Or - Cr);
}

export function getFreeBalanceMonth(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
): number {
  return round2(
    getProjectedMonthEndBalance(data, paymentCategoryId, ref) - getReserved(data.goals),
  );
}

export function getMonthlyBudget(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
  options: BudgetOptions = {},
): number {
  const free = getFreeBalanceMonth(data, paymentCategoryId, ref);
  const buffer = Math.max(0, options.savingsBuffer ?? 0);
  return Math.max(0, round2(free - buffer));
}

export function getDailyBudget(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
  options: BudgetOptions = {},
): number {
  const dr = remainingDaysInMonth(ref);
  return round2(getMonthlyBudget(data, paymentCategoryId, ref, options) / dr);
}

export function getWeeklyBudget(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
  options: BudgetOptions = {},
): number {
  const dr = remainingDaysInMonth(ref);
  return round2(getDailyBudget(data, paymentCategoryId, ref, options) * Math.min(7, dr));
}

/** Decomposição completa para a UI (Planning page mostra cada linha). */
export function getBudgetBreakdown(
  data: EngineData,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
  options: BudgetOptions = {},
): BudgetBreakdown {
  const B0 = getCurrentBalance(data.accounts, data.transactions, ref);
  const R = getReserved(data.goals);
  const Ir = getRemainingIncome(data.recurringIncomes, data.transactions, ref);
  const Or = getRemainingObligations(data, paymentCategoryId, ref);
  const Cr = getRemainingGoalContributions(data.goals, data.goalContributions, ref);
  const projectedMonthEnd = round2(B0 + Ir - Or - Cr);
  const freeBalanceMonth = round2(projectedMonthEnd - R);

  const savingsTarget = Math.max(0, options.savingsBuffer ?? 0);
  const savingsApplied =
    savingsTarget > 0 ? round2(Math.min(savingsTarget, Math.max(0, freeBalanceMonth))) : 0;
  const savingsShortfall = savingsTarget > 0 && freeBalanceMonth < savingsTarget;

  const monthlyBudget = Math.max(0, round2(freeBalanceMonth - savingsApplied));
  const daysRemaining = remainingDaysInMonth(ref);
  const dailyBudget = round2(monthlyBudget / daysRemaining);
  const weeklyBudget = round2(dailyBudget * Math.min(7, daysRemaining));

  return {
    B0,
    R,
    Ir,
    Or,
    Cr,
    availableNow: round2(B0 - R),
    projectedMonthEnd,
    freeBalanceMonth,
    savingsTarget,
    savingsApplied,
    savingsShortfall,
    daysRemaining,
    monthlyBudget,
    weeklyBudget,
    dailyBudget,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
