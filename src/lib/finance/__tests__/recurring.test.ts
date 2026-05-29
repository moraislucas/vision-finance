import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import {
  getRemainingIncome,
  getRemainingRecurringExpenses,
  isRecurringExpenseRealized,
  isRecurringIncomeRealized,
} from '@/lib/finance';
import { makeRecurringExpense, makeRecurringIncome, makeTransaction } from './helpers';

const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('reconciliação (seção 9.2)', () => {
  it('Ir: ignora recorrente com day_of_month < hoje', () => {
    const ri = makeRecurringIncome({ amount: 1000, day_of_month: 5, active: true });
    expect(getRemainingIncome([ri], [], REF)).toBe(0);
  });

  it('Ir: inclui recorrente futura no mês quando não realizada', () => {
    const ri = makeRecurringIncome({ amount: 1000, day_of_month: 25, active: true });
    expect(getRemainingIncome([ri], [], REF)).toBe(1000);
  });

  it('Ir: exclui recorrente já realizada (transaction com recurring_income_id)', () => {
    const ri = makeRecurringIncome({ id: 'ri1', amount: 1000, day_of_month: 25, active: true });
    const tx = makeTransaction({
      type: 'income',
      amount: 1000,
      date: '2025-06-08',
      recurring_income_id: 'ri1',
    });
    expect(isRecurringIncomeRealized(ri, [tx], REF)).toBe(true);
    expect(getRemainingIncome([ri], [tx], REF)).toBe(0);
  });

  it('Or: soma fixas mensais com due_day >= hoje e não realizadas', () => {
    const r1 = makeRecurringExpense({ id: 'r1', amount: 500, due_day: 12 });
    const r2 = makeRecurringExpense({ id: 'r2', amount: 300, due_day: 5 }); // já passou
    expect(getRemainingRecurringExpenses([r1, r2], [], REF)).toBe(500);
  });

  it('Or: anual entra só quando due_month coincide com o mês de ref', () => {
    // REF = 2025-06-10 → mês 6.
    const inJune = makeRecurringExpense({
      id: 'iptu-jun',
      amount: 800,
      due_day: 20,
      frequency: 'yearly',
      due_month: 6,
    });
    const inDec = makeRecurringExpense({
      id: 'iptu-dec',
      amount: 800,
      due_day: 20,
      frequency: 'yearly',
      due_month: 12,
    });
    expect(getRemainingRecurringExpenses([inJune, inDec], [], REF)).toBe(800);
  });

  it('Or: anual com due_day < hoje no mês alvo NÃO entra (já passou)', () => {
    const seguro = makeRecurringExpense({
      id: 'seg',
      amount: 1200,
      due_day: 5,
      frequency: 'yearly',
      due_month: 6,
    });
    // hoje=dia 10, due_day=5 → já passou no mês.
    expect(getRemainingRecurringExpenses([seguro], [], REF)).toBe(0);
  });

  it('Or: transaction com recurring_expense_id reconcilia a obrigação', () => {
    const r1 = makeRecurringExpense({ id: 'r1', amount: 500, due_day: 20 });
    const tx = makeTransaction({
      type: 'expense',
      amount: 500,
      date: '2025-06-08',
      recurring_expense_id: 'r1',
    });
    expect(isRecurringExpenseRealized(r1, [tx], REF)).toBe(true);
    expect(getRemainingRecurringExpenses([r1], [tx], REF)).toBe(0);
  });
});
