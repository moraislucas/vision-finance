/**
 * Testes da agregação semanal — `getMonthWeeklyProjection`.
 *
 * Junho/2025 começa num domingo → semanas alinham limpo: 1–7, 8–14, 15–21,
 * 22–28, 29–30 (5 semanas). Hoje fixado em 10/jun (terça, semana 1).
 */
import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import { getMonthWeeklyProjection, getMonthDailyProjection } from '@/lib/finance';
import { emptyEngineData, makeAccount, makeTransaction } from './helpers';

const TODAY = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('agregação semanal (plano de gastos)', () => {
  it('agrupa o mês em semanas Dom–Sáb alinhadas ao calendário', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    const result = getMonthWeeklyProjection(data, TODAY, null, TODAY);

    expect(result.month).toBe('2025-06');
    expect(result.weeks).toHaveLength(5);
    expect(result.weeks.map((w) => w.days.length)).toEqual([7, 7, 7, 7, 2]);

    // Cobertura total: soma dos dias das semanas = dias do mês.
    const totalDays = result.weeks.reduce((s, w) => s + w.days.length, 0);
    expect(totalDays).toBe(30);

    // Bordas das semanas.
    expect(result.weeks[0].startDate).toBe('2025-06-01');
    expect(result.weeks[0].endDate).toBe('2025-06-07');
    expect(result.weeks[4].startDate).toBe('2025-06-29');
    expect(result.weeks[4].endDate).toBe('2025-06-30');
  });

  it('orçamento da semana = dailyBudget × dias; sem gasto, sobra = orçamento', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    const result = getMonthWeeklyProjection(data, TODAY, null, TODAY);
    const wk0 = result.weeks[0];

    expect(wk0.budget).toBeCloseTo(result.dailyBudget * 7, 1);
    expect(wk0.spent).toBe(0);
    expect(wk0.remaining).toBeCloseTo(wk0.budget, 2);
  });

  it('flags de tempo: semana passada, semana com hoje, semana futura', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    const result = getMonthWeeklyProjection(data, TODAY, null, TODAY);

    // Semana 0 (1–7): toda no passado.
    expect(result.weeks[0].isPast).toBe(true);
    expect(result.weeks[0].containsToday).toBe(false);

    // Semana 1 (8–14): contém hoje (10).
    expect(result.weeks[1].containsToday).toBe(true);
    expect(result.weeks[1].isPast).toBe(false);
    expect(result.weeks[1].isFuture).toBe(false);

    // Semana 4 (29–30): toda no futuro.
    expect(result.weeks[4].isFuture).toBe(true);
    expect(result.weeks[4].status).toBe('future');
  });

  it('soma o gasto variável realizado por semana', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ id: 'a1', initial_balance: 5000 })],
      transactions: [
        makeTransaction({ type: 'expense', amount: 200, date: '2025-06-04', account_id: 'a1' }),
      ],
    };
    const result = getMonthWeeklyProjection(data, TODAY, null, TODAY);
    const wk0 = result.weeks[0];

    expect(wk0.spent).toBe(200);
    expect(wk0.remaining).toBeCloseTo(wk0.budget - 200, 2);
  });

  it('status "over" quando o gasto realizado estoura o orçamento da semana', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ id: 'a1', initial_balance: 5000 })],
      transactions: [
        // Gasto grande numa semana passada → estoura o orçamento daquela semana.
        makeTransaction({ type: 'expense', amount: 2000, date: '2025-06-02', account_id: 'a1' }),
      ],
    };
    const result = getMonthWeeklyProjection(data, TODAY, null, TODAY);
    const wk0 = result.weeks[0];

    expect(wk0.spent).toBe(2000);
    expect(wk0.spent).toBeGreaterThan(wk0.budget);
    expect(wk0.status).toBe('over');
  });

  it('consistência com a projeção diária: saldo da última semana = endingBalance diário', () => {
    const data = {
      ...emptyEngineData(),
      accounts: [makeAccount({ initial_balance: 5000 })],
    };
    const weekly = getMonthWeeklyProjection(data, TODAY, null, TODAY);
    const daily = getMonthDailyProjection(data, TODAY, null, TODAY);

    const lastWeek = weekly.weeks[weekly.weeks.length - 1];
    expect(lastWeek.endBalance).toBeCloseTo(daily.endingBalance, 2);
    expect(weekly.startingBalance).toBe(daily.startingBalance);
  });
});
