/**
 * Score Financeiro 0..100 (seção 9.7) — 5 critérios x 20 pontos.
 */
import { dayjs, today as todayHelper, type Dayjs } from '@/lib/helpers/date';
import type { EngineData, FinancialScore, ScoreBand } from './types';
import { getCurrentBalance } from './balance';
import { getRemainingIncome, getRemainingRecurringExpenses } from './recurring';
import { getProjection } from './projection';
import { getCardInvoice } from './credit-cards';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function bandOf(total: number): ScoreBand {
  if (total >= 90) return 'excellent';
  if (total >= 70) return 'good';
  if (total >= 50) return 'attention';
  return 'critical';
}

export function getFinancialScore(
  data: EngineData,
  paymentCategoryId: string | null = null,
  ref: Dayjs = todayHelper(),
): FinancialScore {
  // 1. Reserva de emergência
  const emergency = data.goals.find((g) => g.is_emergency && g.active);
  const monthlyFixed = data.recurringExpenses
    .filter((re) => re.active && re.frequency === 'monthly')
    .reduce((s, re) => s + Number(re.amount), 0);
  const emergencyTarget = monthlyFixed * 3;
  const emergencyPts =
    emergencyTarget > 0 && emergency
      ? 20 * clamp(Number(emergency.current_amount) / emergencyTarget, 0, 1)
      : emergencyTarget === 0
        ? 20
        : 0;

  // 2. Gasta menos do que ganha (mês atual)
  const ym = ref.format('YYYY-MM');
  let realizedIncome = 0;
  let realizedExpense = 0;
  for (const tx of data.transactions) {
    if (!tx.date.startsWith(ym)) continue;
    const amt = Number(tx.amount);
    if (tx.type === 'income') realizedIncome += amt;
    else realizedExpense += amt;
  }
  const incomeMonth =
    realizedIncome + getRemainingIncome(data.recurringIncomes, data.transactions, ref);
  const expenseMonth =
    realizedExpense + getRemainingRecurringExpenses(data.recurringExpenses, data.transactions, ref);
  const spendsLessPts =
    incomeMonth > 0 ? 20 * clamp((incomeMonth - expenseMonth) / incomeMonth, 0, 1) : 0;

  // 3. Cumpre metas no ritmo (metas com prazo)
  const withDeadline = data.goals.filter((g) => g.active && g.target_date);
  const goalsOnTrackPts =
    withDeadline.length === 0
      ? 20
      : (() => {
          const ratios = withDeadline.map((g) => {
            const start = dayjs(g.created_at);
            const end = dayjs(g.target_date as string);
            const total = Math.max(1, end.diff(start, 'day'));
            const elapsed = clamp(ref.diff(start, 'day') / total, 0, 1);
            const real = Number(g.current_amount) / Math.max(1, Number(g.target_amount));
            const expected = elapsed; // fração esperada
            return clamp(real / Math.max(0.01, expected), 0, 1);
          });
          const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
          return 20 * avg;
        })();

  // 4. Baixo uso de cartão
  const monthlyIncome = data.recurringIncomes
    .filter((ri) => ri.active)
    .reduce((s, ri) => s + Number(ri.amount), 0);
  const openInvoices = data.creditCards.reduce((s, card) => {
    if (!card.active) return s;
    return s + getCardInvoice(card, data.creditCardPurchases, ref).total;
  }, 0);
  const usage = openInvoices / Math.max(1, monthlyIncome);
  const lowCardPts = 20 * clamp(1 - usage / 0.3, 0, 1);

  // 5. Projeção positiva nos próximos 3 meses
  const projection = getProjection(data, 3, paymentCategoryId, ref);
  const futureMonths = projection.slice(1); // ignora o mês atual
  const positiveCount = futureMonths.filter((p) => p.balance >= 0).length;
  const projectionPts = (20 * positiveCount) / 3;

  const breakdown = {
    emergencyReserve: round1(emergencyPts),
    spendsLessThanEarns: round1(spendsLessPts),
    goalsOnTrack: round1(goalsOnTrackPts),
    lowCardUsage: round1(lowCardPts),
    projectionPositive: round1(projectionPts),
  };
  const total = Math.round(
    breakdown.emergencyReserve +
      breakdown.spendsLessThanEarns +
      breakdown.goalsOnTrack +
      breakdown.lowCardUsage +
      breakdown.projectionPositive,
  );

  // Suprime warning de variável não usada (mantida por simetria com 9.1).
  void getCurrentBalance;

  return { total, band: bandOf(total), breakdown };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
