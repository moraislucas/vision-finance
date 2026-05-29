/**
 * Projeção 3/6/12 meses (seção 9.6).
 *
 *   carry = SaldoProjetadoFimMes
 *   projecao[0] = mês atual
 *   for m = 1..N:
 *     income_m  = Σ recurring_incomes ativos (cheio)
 *     fixed_m   = Σ recurring_expenses ativos mensais (anuais ficam fora V1)
 *     faturas_m = Σ faturaDoMes(card, mesAtual+m) por cartão
 *     goals_m   = Σ monthlyTarget(goal) enquanto não atingida
 *     avgVar    = média das despesas variáveis (não-recorrentes, não-cartão) dos
 *                 últimos N meses (default 3) — toggle no app (seção 19).
 *     carry = carry + income_m − fixed_m − faturas_m − goals_m − avgVar
 */
import type { Goal, Transaction } from '@/types/domain';
import { dayjs, monthsUntil, today as todayHelper, type Dayjs } from '@/lib/helpers/date';
import type { EngineData, EngineOptions, ProjectionPoint } from './types';
import { getProjectedMonthEndBalance } from './budget';
import { getCardInvoice } from './credit-cards';
import { getGoalMonthlyTarget } from './goals';

const DEFAULT_OPTS: Required<EngineOptions> = {
  includeAvgVar: true,
  avgVarWindowMonths: 3,
};

/** Média mensal de despesas variáveis nos últimos `window` meses anteriores a `ref`. */
export function getAverageVariableExpense(
  transactions: Transaction[],
  windowMonths: number,
  ref: Dayjs = todayHelper(),
): number {
  if (windowMonths <= 0) return 0;
  const start = ref.startOf('month').subtract(windowMonths, 'month');
  const endExclusive = ref.startOf('month');
  let sum = 0;
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (tx.recurring_expense_id || tx.credit_card_purchase_id) continue; // só variáveis
    const d = dayjs(tx.date);
    if (d.isBefore(start) || !d.isBefore(endExclusive)) continue;
    sum += Number(tx.amount);
  }
  return round2(sum / windowMonths);
}

/** Estima quantos meses ainda faltam até a meta — usa target_date se houver. */
function goalMonthsRemaining(goal: Goal, ref: Dayjs): number {
  if (goal.target_date) return monthsUntil(ref, dayjs(goal.target_date));
  // Sem prazo: enquanto monthly_contribution > 0 e não atingiu, contribui indefinidamente.
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  if (!goal.monthly_contribution || goal.monthly_contribution <= 0) return 0;
  return Math.max(0, Math.ceil((target - current) / Number(goal.monthly_contribution)));
}

export function getProjection(
  data: EngineData,
  months: number,
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
  options: EngineOptions = {},
): ProjectionPoint[] {
  const opts = { ...DEFAULT_OPTS, ...options };
  const points: ProjectionPoint[] = [];

  let carry = getProjectedMonthEndBalance(data, paymentCategoryId, ref);
  points.push({
    month: ref.format('YYYY-MM'),
    balance: round2(carry),
    negative: carry < 0,
  });

  const monthlyIncome = data.recurringIncomes
    .filter((ri) => ri.active)
    .reduce((s, ri) => s + Number(ri.amount), 0);

  // Mensais são pagos todo mês; anuais entram só quando `m+ref` cai em due_month.
  const monthlyFixedTotal = data.recurringExpenses
    .filter((re) => re.active && re.frequency === 'monthly')
    .reduce((s, re) => s + Number(re.amount), 0);

  /** Soma fixas anuais que vencem no mês alvo. */
  function yearlyFixedFor(refMonth: Dayjs): number {
    const m = refMonth.month() + 1;
    return data.recurringExpenses
      .filter((re) => re.active && re.frequency === 'yearly' && re.due_month === m)
      .reduce((s, re) => s + Number(re.amount), 0);
  }

  const avgVar = opts.includeAvgVar
    ? getAverageVariableExpense(data.transactions, opts.avgVarWindowMonths, ref)
    : 0;

  // Estado simulado das metas (só usamos para parar de contribuir quando "termina").
  const goalsRemaining = new Map<string, number>();
  for (const g of data.goals) {
    if (!g.active) continue;
    goalsRemaining.set(g.id, goalMonthsRemaining(g, ref));
  }

  for (let m = 1; m <= months; m++) {
    const monthRef = ref.add(m, 'month');
    const invoicesTotal = data.creditCards.reduce((s, card) => {
      if (!card.active) return s;
      return s + getCardInvoice(card, data.creditCardPurchases, monthRef).total;
    }, 0);

    let goalsTotal = 0;
    for (const g of data.goals) {
      if (!g.active) continue;
      const left = goalsRemaining.get(g.id) ?? 0;
      if (left <= 0) continue;
      goalsTotal += getGoalMonthlyTarget(g, monthRef);
      goalsRemaining.set(g.id, left - 1);
    }

    const fixed_m = monthlyFixedTotal + yearlyFixedFor(monthRef);
    carry = carry + monthlyIncome - fixed_m - invoicesTotal - goalsTotal - avgVar;
    points.push({
      month: monthRef.format('YYYY-MM'),
      balance: round2(carry),
      negative: carry < 0,
    });
  }

  return points;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
