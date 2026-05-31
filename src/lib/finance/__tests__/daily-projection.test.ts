/**
 * Testes da projeção diária — `getMonthDailyProjection`.
 */
import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import { getMonthDailyProjection, getCurrentBalance } from '@/lib/finance';
import {
  emptyEngineData,
  makeAccount,
  makeRecurringExpense,
  makeRecurringIncome,
  makeTransaction,
} from './helpers';

const TODAY = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('projeção diária (calendário/extrato)', () => {
  it('mês atual com saldo inicial de 5.000 e nada acontecendo: dailyBudget descontado em HOJE também (fix do bug)', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    const result = getMonthDailyProjection(data, TODAY, null, TODAY);

    expect(result.month).toBe('2025-06');
    expect(result.rows).toHaveLength(30);
    expect(result.startingBalance).toBe(5000);

    // Dias passados (1..9): nada aconteceu, saldo intacto.
    expect(result.rows[0].isPast).toBe(true);
    expect(result.rows[0].endBalance).toBe(5000);
    expect(result.rows[8].endBalance).toBe(5000);

    // Hoje (10/jun): consome o dailyBudget integralmente (varRealized = 0).
    const todayRow = result.rows[9];
    expect(todayRow.isToday).toBe(true);
    expect(todayRow.discretionary).toBe(result.dailyBudget);
    expect(todayRow.endBalance).toBeCloseTo(5000 - result.dailyBudget, 2);

    // Dia 11 (futuro): desconta mais um dailyBudget.
    const day11 = result.rows[10];
    expect(day11.isFuture).toBe(true);
    expect(day11.discretionary).toBe(result.dailyBudget);
    expect(day11.endBalance).toBeCloseTo(5000 - 2 * result.dailyBudget, 2);

    // Último dia (30/jun): saldo restante deve ser ≈ 0 (gastou exatamente 21 × dailyBudget).
    const last = result.rows[29];
    expect(last.endBalance).toBeCloseTo(0, 0);
  });

  it('savingsBuffer reduz o dailyBudget e GARANTE sobra ao fim do mês', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    // Sem buffer: ao fim do mês, ~zero.
    const noBuf = getMonthDailyProjection(data, TODAY, null, TODAY);
    expect(noBuf.endingBalance).toBeCloseTo(0, 0);

    // Com buffer de R$ 500: ao fim do mês, sobra ~R$ 500.
    const withBuf = getMonthDailyProjection(data, TODAY, null, TODAY, {
      savingsBuffer: 500,
    });
    expect(withBuf.endingBalance).toBeCloseTo(500, 0);
    expect(withBuf.dailyBudget).toBeLessThan(noBuf.dailyBudget);
  });

  it('passado: usa transações realizadas (income/expense) somando ao saldo', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ id: 'a1', initial_balance: 2000, include_in_available: true })],
      transactions: [
        makeTransaction({
          type: 'income',
          amount: 1000,
          date: '2025-06-05',
          account_id: 'a1',
        }),
        makeTransaction({
          type: 'expense',
          amount: 200,
          date: '2025-06-07',
          account_id: 'a1',
        }),
      ],
    };
    const result = getMonthDailyProjection(data, TODAY, null, TODAY);

    const d5 = result.rows[4];
    expect(d5.inflows).toBe(1000);
    expect(d5.endBalance).toBe(3000); // 2000 inicial + 1000

    const d6 = result.rows[5];
    expect(d6.endBalance).toBe(3000); // sem movimentação

    const d7 = result.rows[6];
    expect(d7.outflows).toBe(200);
    expect(d7.endBalance).toBe(2800);
    expect(d7.discretionary).toBe(200); // gasto variável conta como discricionário no passado
  });

  it('futuro: recorrentes ativas que caem no dia entram em inflows/outflows', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 10000 })],
      recurringIncomes: [
        makeRecurringIncome({ amount: 5000, day_of_month: 25, active: true }),
      ],
      recurringExpenses: [
        makeRecurringExpense({ amount: 1500, due_day: 15, active: true }),
      ],
    };
    const result = getMonthDailyProjection(data, TODAY, null, TODAY);

    const d15 = result.rows[14];
    expect(d15.outflows).toBe(1500);

    const d25 = result.rows[24];
    expect(d25.inflows).toBe(5000);
  });

  it('realBalance: "hoje" bate com getCurrentBalance, futuro é null e endBalance é preservado', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ id: 'a1', initial_balance: 2000, include_in_available: true })],
      transactions: [
        makeTransaction({ type: 'income', amount: 1000, date: '2025-06-05', account_id: 'a1' }),
        makeTransaction({ type: 'expense', amount: 200, date: '2025-06-07', account_id: 'a1' }),
      ],
    };
    const result = getMonthDailyProjection(data, TODAY, null, TODAY);
    const realToday = getCurrentBalance(data.accounts, data.transactions, TODAY);

    // Hoje (10/jun): realBalance = saldo real (2800), SEM reservar o budget.
    const todayRow = result.rows[9];
    expect(todayRow.isToday).toBe(true);
    expect(todayRow.realBalance).toBe(2800);
    expect(todayRow.realBalance).toBe(realToday);
    // endBalance (trajetória) continua reservando o budget de hoje.
    expect(todayRow.endBalance).toBeCloseTo(2800 - result.dailyBudget, 2);

    // Passado: realBalance == endBalance (não há budget reservado).
    expect(result.rows[6].realBalance).toBe(result.rows[6].endBalance);

    // Futuro: realBalance é null (lá só existe a trajetória projetada).
    expect(result.rows[10].isFuture).toBe(true);
    expect(result.rows[10].realBalance).toBeNull();
  });

  it('navegação entre meses: mês futuro tem startingBalance baseado em hoje', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 3000 })],
    };
    // Pula pra julho — todas as datas estão no futuro.
    const julyRef = dayjs.tz('2025-07-01', 'America/Sao_Paulo').startOf('day');
    const result = getMonthDailyProjection(data, julyRef, null, TODAY);

    expect(result.month).toBe('2025-07');
    expect(result.rows).toHaveLength(31);
    // Saldo no fim do dia 30/jun = 3000 (sem transações entre hoje 10/jun e 30/jun)
    expect(result.startingBalance).toBe(3000);
    // Todos os dias de julho são futuros.
    expect(result.rows.every((r) => r.isFuture)).toBe(true);
  });
});
