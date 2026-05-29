/**
 * Insights automáticos (seção 9.8) — regras simples, sem IA.
 *
 * Cada insight tem `severity` para a UI escolher cor (alerta, neutro, positivo).
 */
import { dayjs, today as todayHelper, type Dayjs } from '@/lib/helpers/date';
import type { EngineData } from './types';
import { getProjection } from './projection';
import { getGoalMonthlyTarget } from './goals';
import { getCardInvoice } from './credit-cards';

export type InsightSeverity = 'info' | 'warning' | 'positive';

export interface Insight {
  id: string;
  message: string;
  severity: InsightSeverity;
}

export function getInsights(
  data: EngineData,
  paymentCategoryId: string | null = null,
  ref: Dayjs = todayHelper(),
): Insight[] {
  const out: Insight[] = [];
  const ym = ref.format('YYYY-MM');
  const lastYM = ref.subtract(1, 'month').format('YYYY-MM');

  // (1) Maior variação de categoria mês atual vs. anterior (apenas despesa).
  const byCatNow = new Map<string, number>();
  const byCatLast = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.type !== 'expense' || !tx.category_id) continue;
    if (tx.date.startsWith(ym)) {
      byCatNow.set(tx.category_id, (byCatNow.get(tx.category_id) ?? 0) + Number(tx.amount));
    } else if (tx.date.startsWith(lastYM)) {
      byCatLast.set(tx.category_id, (byCatLast.get(tx.category_id) ?? 0) + Number(tx.amount));
    }
  }
  let worst: { id: string; pct: number } | null = null;
  for (const [catId, nowVal] of byCatNow.entries()) {
    const lastVal = byCatLast.get(catId) ?? 0;
    if (lastVal <= 0) continue;
    const pct = (nowVal - lastVal) / lastVal;
    if (pct > 0.2 && (!worst || pct > worst.pct)) {
      worst = { id: catId, pct };
    }
  }
  if (worst) {
    const name =
      (data.categories ?? []).find((c) => c.id === worst!.id)?.name ?? 'categoria';
    out.push({
      id: 'category-spike',
      severity: 'warning',
      message: `Você gastou ${Math.round(worst.pct * 100)}% mais com ${name} este mês.`,
    });
  }

  // (2) Projeção negativa em algum mês dos próximos 3.
  const proj = getProjection(data, 3, paymentCategoryId, ref);
  const firstNegative = proj.find((p) => p.balance < 0 && p.month !== ym);
  if (firstNegative) {
    const m = dayjs(`${firstNegative.month}-01`).format('MMMM');
    out.push({
      id: 'projection-negative',
      severity: 'warning',
      message: `Atenção: saldo previsto negativo em ${m}.`,
    });
  }

  // (3) Comprometimento do cartão — soma das faturas dos próximos 3 meses
  // dividida pela renda mensal recorrente. Acima de 30% vira warning.
  const monthlyIncome = data.recurringIncomes
    .filter((ri) => ri.active)
    .reduce((s, ri) => s + Number(ri.amount), 0);
  if (monthlyIncome > 0 && data.creditCards.length > 0) {
    let invoicesNext3 = 0;
    for (let i = 1; i <= 3; i++) {
      const month = ref.add(i, 'month');
      for (const card of data.creditCards) {
        if (!card.active) continue;
        invoicesNext3 += getCardInvoice(card, data.creditCardPurchases, month).total;
      }
    }
    const commitment = invoicesNext3 / (monthlyIncome * 3); // fração da renda dos 3 meses
    if (commitment >= 0.3) {
      out.push({
        id: 'card-commitment-high',
        severity: 'warning',
        message: `Seu cartão compromete ${Math.round(commitment * 100)}% da sua renda nos próximos 3 meses.`,
      });
    } else if (commitment >= 0.15) {
      out.push({
        id: 'card-commitment-moderate',
        severity: 'info',
        message: `Cartão consome ${Math.round(commitment * 100)}% da sua renda nos próximos 3 meses.`,
      });
    }
  }

  // (4) Meta no ritmo — quantos meses até atingir
  for (const g of data.goals) {
    if (!g.active) continue;
    const target = getGoalMonthlyTarget(g, ref);
    if (target <= 0) continue;
    const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
    if (remaining === 0) {
      out.push({
        id: `goal-done-${g.id}`,
        severity: 'positive',
        message: `Você atingiu a meta "${g.name}". Parabéns!`,
      });
      continue;
    }
    const monthsLeft = Math.ceil(remaining / target);
    if (monthsLeft <= 12) {
      out.push({
        id: `goal-eta-${g.id}`,
        severity: 'info',
        message: `No ritmo atual, você atinge "${g.name}" em ${monthsLeft} ${monthsLeft === 1 ? 'mês' : 'meses'}.`,
      });
    }
  }

  return out;
}
