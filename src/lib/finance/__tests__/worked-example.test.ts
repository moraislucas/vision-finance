/**
 * Exemplo trabalhado — seção 9.5 do VISION_FINANCE_CONTEXT.md.
 *
 * Cenário canônico (dia 10, mês de 30 dias):
 *   B0 = 5.000; R = 1.500; Ir = 0; Or = 1.200; Cr = 500
 *   DisponívelAgora        = 3.500
 *   SaldoProjetadoFimMes   = 3.300
 *   SaldoLivreMes          = 1.800
 *   diasRestantes          = 21
 *   PodeGastarDia          ≈ R$ 85,71
 *   PodeGastarSemana       ≈ R$ 600
 *
 * Este teste é o "smoke test do contrato" da Engine. Quebrou aqui → o produto
 * inteiro está errado: trate como bug crítico, NÃO ajuste expectativa.
 */
import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import type { EngineData } from '@/lib/finance';
import {
  getAvailableNow,
  getBudgetBreakdown,
  getCurrentBalance,
  getDailyBudget,
  getFreeBalanceMonth,
  getMonthlyBudget,
  getProjectedMonthEndBalance,
  getRemainingGoalContributions,
  getRemainingIncome,
  getRemainingObligations,
  getReserved,
  getWeeklyBudget,
} from '@/lib/finance';
import {
  emptyEngineData,
  makeAccount,
  makeGoal,
  makeRecurringExpense,
  makeTransaction,
} from './helpers';

/** Junho/2025 tem 30 dias — combina com "mês de 30 dias" da seção. */
const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

function buildWorkedExampleData(): EngineData {
  const account = makeAccount({
    id: 'acc-main',
    initial_balance: 4000,
    include_in_available: true,
  });

  // Renda já realizada este mês (B0 vira 5.000 e Ir fica 0).
  const income = makeTransaction({
    id: 'tx-income',
    type: 'income',
    amount: 1000,
    date: '2025-06-05',
    account_id: 'acc-main',
  });

  // Conta fixa de R$ 1.200, vencimento dia 20 (>= 10) e não realizada → Or = 1200.
  const expense = makeRecurringExpense({
    id: 're-rent',
    name: 'Aluguel',
    amount: 1200,
    due_day: 20,
    frequency: 'monthly',
    active: true,
  });

  // Meta: R$ 500/mês fixo, R$ 1.500 já reservados, nenhum aporte este mês → Cr=500, R=1500.
  const goal = makeGoal({
    id: 'goal-emergency',
    name: 'Reserva',
    target_amount: 10_000,
    current_amount: 1500,
    monthly_contribution: 500,
    is_emergency: true,
    active: true,
  });

  return {
    ...emptyEngineData(),
    accounts: [account],
    transactions: [income],
    recurringExpenses: [expense],
    goals: [goal],
  };
}

describe('Engine — exemplo trabalhado (seção 9.5)', () => {
  const data = buildWorkedExampleData();
  const ref = REF;

  it('B0 = 5.000', () => {
    expect(getCurrentBalance(data.accounts, data.transactions, ref)).toBe(5000);
  });

  it('R (reservado) = 1.500', () => {
    expect(getReserved(data.goals)).toBe(1500);
  });

  it('Disponível agora = B0 − R = 3.500', () => {
    expect(getAvailableNow(data.accounts, data.transactions, data.goals, ref)).toBe(3500);
  });

  it('Ir (receita restante) = 0 (salário já caiu)', () => {
    expect(getRemainingIncome(data.recurringIncomes, data.transactions, ref)).toBe(0);
  });

  it('Or (obrigações restantes) = 1.200', () => {
    expect(getRemainingObligations(data, null, ref)).toBe(1200);
  });

  it('Cr (pendência de meta este mês) = 500', () => {
    expect(getRemainingGoalContributions(data.goals, data.goalContributions, ref)).toBe(500);
  });

  it('Saldo Projetado fim do mês = 3.300', () => {
    expect(getProjectedMonthEndBalance(data, null, ref)).toBe(3300);
  });

  it('Saldo Livre do mês = 1.800', () => {
    expect(getFreeBalanceMonth(data, null, ref)).toBe(1800);
  });

  it('Pode Gastar mês = 1.800', () => {
    expect(getMonthlyBudget(data, null, ref)).toBe(1800);
  });

  it('Pode Gastar dia ≈ R$ 85,71 (1800 / 21)', () => {
    const daily = getDailyBudget(data, null, ref);
    expect(daily).toBeCloseTo(85.71, 2);
  });

  it('Pode Gastar semana ≈ R$ 600 (85,71 × 7)', () => {
    // Math.round(85.71 * 7 * 100) / 100 = 599.97 — aceitamos arredondamento.
    const weekly = getWeeklyBudget(data, null, ref);
    expect(weekly).toBeGreaterThanOrEqual(599);
    expect(weekly).toBeLessThanOrEqual(600.5);
  });

  it('Breakdown completo bate com o exemplo (números canônicos da seção 9.5)', () => {
    const b = getBudgetBreakdown(data, null, ref);
    expect(b.B0).toBe(5000);
    expect(b.R).toBe(1500);
    expect(b.Ir).toBe(0);
    expect(b.Or).toBe(1200);
    expect(b.Cr).toBe(500);
    expect(b.availableNow).toBe(3500);
    expect(b.projectedMonthEnd).toBe(3300);
    expect(b.freeBalanceMonth).toBe(1800);
    expect(b.daysRemaining).toBe(21);
    expect(b.monthlyBudget).toBe(1800);
  });
});
