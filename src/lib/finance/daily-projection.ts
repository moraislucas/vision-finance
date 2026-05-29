/**
 * Projeção diária — uma linha por dia do mês com saldo corrente.
 *
 * Diferente do `getProjection` (que dá um saldo por mês), esta função entrega
 * granularidade diária para a "view de saldos" estilo extrato/calendário.
 *
 * Regras:
 *   - PASSADO: usa transações REAIS do dia (income/expense).
 *   - HOJE: usa transações reais + reserva o que falta gastar hoje (até
 *     atingir o `dailyBudget`). Garante que o endBalance reflete uma trajetória
 *     em que o usuário consome o budget até o fim do mês.
 *   - FUTURO: usa recorrentes/faturas previstas + `dailyBudget`.
 *   - Saldo inicial: agregado das contas com include_in_available no dia
 *     anterior ao primeiro do mês.
 *
 * Opcional: `savingsBuffer` (R$ que devem sobrar como poupança automática
 * além das metas). Quando setada, o `dailyBudget` interno é reduzido para
 * preservar essa margem.
 */
import type { Account, Transaction } from '@/types/domain';
import {
  dayjs,
  today as todayHelper,
  safeDateInMonth,
  type Dayjs,
} from '@/lib/helpers/date';
import type { EngineData } from './types';
import { getAccountBalance, round2 } from './balance';
import { getCardInvoice } from './credit-cards';
import { isRecurringExpenseRealized, isRecurringIncomeRealized } from './recurring';
import { getBudgetBreakdown, type BudgetOptions } from './budget';

export interface DailyLedgerRow {
  /** Dia do mês (1..31). */
  day: number;
  /** Data ISO (YYYY-MM-DD). */
  date: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  /** Entradas realizadas (passado) ou previstas (futuro). */
  inflows: number;
  /** Saídas realizadas (passado) ou previstas (futuro). NÃO inclui `discretionary`. */
  outflows: number;
  /**
   * Gasto variável discricionário:
   *  - passado: soma de despesas variáveis (sem vínculo a fixa/cartão) lançadas no dia.
   *  - hoje: max(realizado, dailyBudget) — mostra ao usuário o limite do dia.
   *  - futuro: dailyBudget projetado.
   */
  discretionary: number;
  /** Saldo ao FIM do dia (com toda a projeção aplicada). */
  endBalance: number;
}

export interface MonthDailyProjection {
  /** YYYY-MM. */
  month: string;
  /** Saldo no fim do dia anterior ao primeiro do mês. */
  startingBalance: number;
  /** Saldo ao fim do último dia do mês. */
  endingBalance: number;
  /** Orçamento diário usado nas linhas presentes/futuras. */
  dailyBudget: number;
  /** Linhas, uma por dia. */
  rows: DailyLedgerRow[];
}

/**
 * Saldo total agregado em uma data específica (inclui contas com
 * `include_in_available=true`).
 */
function balanceAtDate(
  accounts: Account[],
  transactions: Transaction[],
  ref: Dayjs,
): number {
  return round2(
    accounts
      .filter((a) => a.include_in_available)
      .reduce((sum, a) => sum + getAccountBalance(a, transactions, ref), 0),
  );
}

export function getMonthDailyProjection(
  data: EngineData,
  monthRef: Dayjs,
  paymentCategoryId: string | null = null,
  todayRef: Dayjs = todayHelper(),
  options: BudgetOptions = {},
): MonthDailyProjection {
  const ym = monthRef.format('YYYY-MM');
  const monthStart = monthRef.startOf('month');
  const lastDay = monthStart.daysInMonth();
  const dayBeforeMonth = monthStart.subtract(1, 'day');
  const todayDate = todayRef.format('YYYY-MM-DD');

  let runningBalance = balanceAtDate(data.accounts, data.transactions, dayBeforeMonth);
  const startingBalance = runningBalance;

  // Orçamento diário (já desconta o `savingsBuffer` se passado em options).
  const dailyBudget = computeDailyBudgetFor(
    data,
    monthRef,
    paymentCategoryId,
    todayRef,
    startingBalance,
    options,
  );

  const rows: DailyLedgerRow[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dDate = safeDateInMonth(monthRef.year(), monthRef.month(), d);
    const date = dDate.format('YYYY-MM-DD');
    const isPast = date < todayDate;
    const isToday = date === todayDate;
    const isFuture = date > todayDate;

    let inflows = 0;
    let outflows = 0;
    let varRealized = 0; // gasto variável já lançado no dia

    if (!isFuture) {
      for (const tx of data.transactions) {
        if (tx.date !== date) continue;
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          inflows += amt;
        } else {
          outflows += amt;
          if (!tx.recurring_expense_id && !tx.credit_card_purchase_id) {
            varRealized += amt;
          }
        }
      }
    }

    let inflowsForecast = 0;
    let outflowsForecast = 0;
    if (isFuture) {
      for (const ri of data.recurringIncomes) {
        if (!ri.active) continue;
        if (ri.day_of_month !== d) continue;
        if (isRecurringIncomeRealized(ri, data.transactions, monthRef)) continue;
        inflowsForecast += Number(ri.amount);
      }
      for (const re of data.recurringExpenses) {
        if (!re.active) continue;
        if (re.due_day !== d) continue;
        if (re.frequency === 'yearly' && re.due_month !== monthRef.month() + 1) continue;
        if (isRecurringExpenseRealized(re, data.transactions, monthRef)) continue;
        outflowsForecast += Number(re.amount);
      }
      for (const card of data.creditCards) {
        if (!card.active) continue;
        if (card.due_day !== d) continue;
        outflowsForecast += getCardInvoice(card, data.creditCardPurchases, monthRef).total;
      }
      // suppress unused parameter while paymentCategoryId não é necessário aqui
      void (paymentCategoryId as unknown);
    }

    const totalInflows = inflows + inflowsForecast;
    const totalOutflows = outflows + outflowsForecast;

    // discricionário projetado:
    //  - passado: já realizado (informativo, balance não é descontado de novo)
    //  - hoje: ao MENOS o dailyBudget (se ele já gastou mais, mostra o real;
    //          se gastou menos, completa até o limite para projetar trajetória)
    //  - futuro: dailyBudget
    let discretionary = 0;
    let projectedSpend = 0;
    if (isFuture) {
      discretionary = dailyBudget;
      projectedSpend = dailyBudget;
    } else if (isToday) {
      discretionary = Math.max(varRealized, dailyBudget);
      // Já gastou parte → desconta o restante do budget pra fechar a projeção.
      projectedSpend = Math.max(0, round2(dailyBudget - varRealized));
    } else {
      // Passado: discricionário só informativo (já contado em outflows).
      discretionary = varRealized;
      projectedSpend = 0;
    }

    runningBalance = round2(
      runningBalance + totalInflows - totalOutflows - projectedSpend,
    );

    rows.push({
      day: d,
      date,
      isPast,
      isToday,
      isFuture,
      inflows: round2(totalInflows),
      outflows: round2(totalOutflows),
      discretionary: round2(discretionary),
      endBalance: runningBalance,
    });
  }

  return {
    month: ym,
    startingBalance,
    endingBalance: runningBalance,
    dailyBudget,
    rows,
  };
}

/** Quando hoje cair no mês alvo, usa o budget do mês corrente. Senão recalcula. */
function computeDailyBudgetFor(
  data: EngineData,
  monthRef: Dayjs,
  paymentCategoryId: string | null,
  todayRef: Dayjs,
  startingBalance: number,
  options: BudgetOptions,
): number {
  const isCurrentMonth =
    todayRef.year() === monthRef.year() && todayRef.month() === monthRef.month();

  if (isCurrentMonth) {
    return getBudgetBreakdown(data, paymentCategoryId, todayRef, options).dailyBudget;
  }

  // Mês futuro: estimativa simples. Soma renda recorrente, subtrai fixas
  // do mês alvo + faturas, desconta o savingsBuffer, divide por dias do mês.
  const monthlyIncome = data.recurringIncomes
    .filter((ri) => ri.active)
    .reduce((s, ri) => s + Number(ri.amount), 0);
  const monthlyFixed = data.recurringExpenses
    .filter((re) => re.active && re.frequency === 'monthly')
    .reduce((s, re) => s + Number(re.amount), 0);
  const yearlyFixed = data.recurringExpenses
    .filter(
      (re) =>
        re.active && re.frequency === 'yearly' && re.due_month === monthRef.month() + 1,
    )
    .reduce((s, re) => s + Number(re.amount), 0);
  const invoices = data.creditCards
    .filter((card) => card.active)
    .reduce(
      (s, card) => s + getCardInvoice(card, data.creditCardPurchases, monthRef).total,
      0,
    );
  const buffer = Math.max(0, options.savingsBuffer ?? 0);

  const monthlyFree =
    startingBalance + monthlyIncome - monthlyFixed - yearlyFixed - invoices - buffer;
  const days = monthRef.daysInMonth();
  return Math.max(0, round2(monthlyFree / days));
}

function _silence() {
  void dayjs;
}
void _silence;

/** Re-export pra Tooltips/Tests que precisem da função interna. */
export { balanceAtDate as _balanceAtDate };
