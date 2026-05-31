/**
 * Cofrinhos / metas (seção 9.3).
 *
 *   monthlyTarget(goal):
 *     - se target_date: max(0, (target - current)) / mesesCheios(hoje, target_date)
 *     - senão se monthly_contribution: monthly_contribution
 *     - senão: 0
 *
 *   Cr = Σ max(0, monthlyTarget(goal) − contributedThisMonth(goal))
 *
 * R (reservado) vive em `balance.ts` — somatório de current_amount.
 */
import type { Goal, GoalContribution } from '@/types/domain';
import { dayjs, monthsUntil, today as todayHelper, type Dayjs } from '@/lib/helpers/date';

/** Quanto a meta exige por mês (positivo, arredondado). */
export function getGoalMonthlyTarget(goal: Goal, ref: Dayjs = todayHelper()): number {
  if (!goal.active) return 0;
  if (goal.target_date) {
    const target = dayjs(goal.target_date);
    const months = monthsUntil(ref, target);
    const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
    return round2(remaining / months);
  }
  if (goal.monthly_contribution != null) {
    return round2(Number(goal.monthly_contribution));
  }
  return 0;
}

/**
 * Data prevista de conclusão da meta.
 *  - com `target_date`: é a própria data alvo.
 *  - sem prazo, com `monthly_contribution`: estima `ceil(restante / mensal)` meses.
 *  - já atingida, ou sem ritmo de contribuição: null.
 */
export function getGoalCompletionDate(
  goal: Goal,
  ref: Dayjs = todayHelper(),
): Dayjs | null {
  if (!goal.active) return null;
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  if (remaining <= 0) return null;
  if (goal.target_date) return dayjs(goal.target_date);
  if (goal.monthly_contribution && Number(goal.monthly_contribution) > 0) {
    const months = Math.ceil(remaining / Number(goal.monthly_contribution));
    return ref.add(months, 'month');
  }
  return null;
}

/** Alvo diário e semanal (seção 9.3). */
export function getGoalDailyTarget(goal: Goal, ref: Dayjs = todayHelper()): number {
  return round2(getGoalMonthlyTarget(goal, ref) / ref.daysInMonth());
}
export function getGoalWeeklyTarget(goal: Goal, ref: Dayjs = todayHelper()): number {
  return round2(getGoalMonthlyTarget(goal, ref) / 4.345);
}

/** Soma dos aportes da meta dentro do mês de `ref`. */
export function getContributedThisMonth(
  goal: Goal,
  contributions: GoalContribution[],
  ref: Dayjs = todayHelper(),
): number {
  const ym = ref.format('YYYY-MM');
  let sum = 0;
  for (const gc of contributions) {
    if (gc.goal_id !== goal.id) continue;
    if (!gc.date.startsWith(ym)) continue;
    sum += Number(gc.amount);
  }
  return round2(sum);
}

/** Cr — pendência total de contribuição restante este mês (não some com R!). */
export function getRemainingGoalContributions(
  goals: Goal[],
  contributions: GoalContribution[],
  ref: Dayjs = todayHelper(),
): number {
  let sum = 0;
  for (const g of goals) {
    if (!g.active) continue;
    const target = getGoalMonthlyTarget(g, ref);
    if (target <= 0) continue;
    const done = getContributedThisMonth(g, contributions, ref);
    const pending = Math.max(0, target - done);
    sum += pending;
  }
  return round2(sum);
}

/** Progresso percentual da meta (0..1 — sem cap). */
export function getGoalProgress(goal: Goal): number {
  const target = Number(goal.target_amount);
  if (target <= 0) return 0;
  return round2(Number(goal.current_amount) / target);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
