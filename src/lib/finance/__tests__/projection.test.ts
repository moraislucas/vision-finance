import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import { getProjection } from '@/lib/finance';
import {
  emptyEngineData,
  makeAccount,
  makeCreditCard,
  makeGoal,
  makePurchase,
  makeRecurringExpense,
  makeRecurringIncome,
  makeTransaction,
} from './helpers';

const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('projeção (seção 9.6)', () => {
  it('projeção de 3 meses retorna 4 pontos (mês atual + 3)', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 1000 })],
      recurringIncomes: [makeRecurringIncome({ amount: 2000, day_of_month: 5, active: true })],
      recurringExpenses: [makeRecurringExpense({ amount: 800, due_day: 10, active: true })],
    };
    const proj = getProjection(data, 3, null, REF, { includeAvgVar: false });
    expect(proj).toHaveLength(4);
    expect(proj[0].month).toBe('2025-06');
    expect(proj[3].month).toBe('2025-09');
  });

  it('parcela 12x aparece descontada na projeção de 12 meses', () => {
    const card = makeCreditCard({ id: 'c1', closing_day: 25, due_day: 5 });
    const purchase = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-06-10',
      total_amount: 1200,
      installments: 12,
    });
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 10000 })],
      creditCards: [card],
      creditCardPurchases: [purchase],
    };
    const proj = getProjection(data, 12, null, REF, { includeAvgVar: false });
    // Sem renda nem outras despesas, cada mês deve cair ~100 (1200/12) por 12 meses.
    const totalImpact = proj[0].balance - proj[12].balance;
    expect(totalImpact).toBeCloseTo(1200, 0);
  });

  it('marca meses com saldo < 0 como negative=true', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 100 })],
      recurringExpenses: [makeRecurringExpense({ amount: 500, due_day: 15, active: true })],
    };
    const proj = getProjection(data, 3, null, REF, { includeAvgVar: false });
    expect(proj.some((p) => p.negative)).toBe(true);
  });

  it('avgVar usa média dos últimos N meses quando ligado', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 10000 })],
      transactions: [
        // 3 meses anteriores: 300, 600, 900 → média 600
        makeTransaction({ type: 'expense', amount: 300, date: '2025-03-15' }),
        makeTransaction({ type: 'expense', amount: 600, date: '2025-04-15' }),
        makeTransaction({ type: 'expense', amount: 900, date: '2025-05-15' }),
      ],
    };
    const withAvg = getProjection(data, 1, null, REF, { includeAvgVar: true, avgVarWindowMonths: 3 });
    const without = getProjection(data, 1, null, REF, { includeAvgVar: false });
    expect(without[1].balance - withAvg[1].balance).toBeCloseTo(600, 0);
  });

  it('meta sem prazo para de descontar quando atinge target', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 10000 })],
      goals: [
        makeGoal({
          target_amount: 200,
          current_amount: 0,
          monthly_contribution: 100,
        }),
      ],
    };
    const proj = getProjection(data, 5, null, REF, { includeAvgVar: false });
    // só 2 meses descontando 100 = 200 total — depois para.
    const impact = proj[0].balance - proj[5].balance;
    expect(impact).toBeCloseTo(200, 0);
  });
});
