import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import {
  getContributedThisMonth,
  getGoalMonthlyTarget,
  getGoalProgress,
  getRemainingGoalContributions,
} from '@/lib/finance';
import { makeGoal, makeGoalContribution } from './helpers';

const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('metas / cofrinhos (seção 9.3)', () => {
  it('monthlyTarget com prazo: (target − current) / meses até o prazo', () => {
    const g = makeGoal({
      target_amount: 6000,
      current_amount: 0,
      target_date: '2025-12-10', // ~6 meses
    });
    const t = getGoalMonthlyTarget(g, REF);
    expect(t).toBeCloseTo(1000, 0);
  });

  it('monthlyTarget sem prazo usa monthly_contribution', () => {
    const g = makeGoal({ monthly_contribution: 250 });
    expect(getGoalMonthlyTarget(g, REF)).toBe(250);
  });

  it('contributedThisMonth ignora aportes de outros meses', () => {
    const g = makeGoal({ id: 'g1' });
    const cs = [
      makeGoalContribution({ goal_id: 'g1', amount: 100, date: '2025-06-03' }),
      makeGoalContribution({ goal_id: 'g1', amount: 50, date: '2025-05-30' }),
    ];
    expect(getContributedThisMonth(g, cs, REF)).toBe(100);
  });

  it('Cr cai quando há aporte parcial no mês', () => {
    const g = makeGoal({ id: 'g1', monthly_contribution: 500 });
    const cs = [makeGoalContribution({ goal_id: 'g1', amount: 200, date: '2025-06-02' })];
    expect(getRemainingGoalContributions([g], cs, REF)).toBe(300);
  });

  it('getGoalProgress = current/target (sem cap)', () => {
    const g = makeGoal({ current_amount: 250, target_amount: 1000 });
    expect(getGoalProgress(g)).toBe(0.25);
  });
});
