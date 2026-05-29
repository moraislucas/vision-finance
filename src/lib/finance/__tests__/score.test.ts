import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import { getFinancialScore } from '@/lib/finance';
import {
  emptyEngineData,
  makeAccount,
  makeGoal,
  makeRecurringExpense,
  makeRecurringIncome,
  makeTransaction,
} from './helpers';

const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('score financeiro (seção 9.7)', () => {
  it('zera reserva quando não existe meta de emergência mas há fixas', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 10000 })],
      recurringIncomes: [makeRecurringIncome({ amount: 5000, day_of_month: 5 })],
      recurringExpenses: [makeRecurringExpense({ amount: 2000, due_day: 10 })],
    };
    const s = getFinancialScore(data, null, REF);
    expect(s.breakdown.emergencyReserve).toBe(0);
  });

  it('atribui 20 pts na reserva quando current_amount cobre 3× fixas', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 100000 })],
      recurringIncomes: [makeRecurringIncome({ amount: 5000, day_of_month: 5 })],
      recurringExpenses: [makeRecurringExpense({ amount: 2000, due_day: 10 })],
      goals: [makeGoal({ is_emergency: true, current_amount: 6000, target_amount: 6000 })],
    };
    const s = getFinancialScore(data, null, REF);
    expect(s.breakdown.emergencyReserve).toBe(20);
  });

  it('faixa textual reflete o total', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 100000 })],
      recurringIncomes: [makeRecurringIncome({ amount: 10000, day_of_month: 5 })],
      // Pequenas fixas, com reserva e baixo uso de cartão.
      recurringExpenses: [makeRecurringExpense({ amount: 1000, due_day: 10 })],
      goals: [makeGoal({ is_emergency: true, current_amount: 3000, target_amount: 3000 })],
      transactions: [
        makeTransaction({ type: 'income', amount: 10000, date: '2025-06-01' }),
        makeTransaction({ type: 'expense', amount: 500, date: '2025-06-03' }),
      ],
    };
    const s = getFinancialScore(data, null, REF);
    expect(['excellent', 'good']).toContain(s.band);
  });
});
