/**
 * Reconciliação previsto × realizado (seção 9.2).
 *
 *   Ir (receita restante) = Σ recurring_incomes ativas, NÃO realizadas este mês,
 *                           com day_of_month >= hoje.dia.
 *   Or (obrigação restante) = Σ recurring_expenses + faturas a vencer ainda
 *                              não pagas, com due_day >= hoje.dia.
 *
 * Uma recorrente é "realizada" quando existe transaction no mês atual cujo
 * `recurring_income_id`/`recurring_expense_id` aponta para ela.
 */
import type {
  RecurringExpense,
  RecurringIncome,
  Transaction,
} from '@/types/domain';
import { today as todayHelper, type Dayjs } from '@/lib/helpers/date';

function isInMonth(dateStr: string, ref: Dayjs): boolean {
  const year = ref.year();
  const month = ref.month() + 1; // 1-based
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m === month;
}

export function isRecurringIncomeRealized(
  income: RecurringIncome,
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): boolean {
  return transactions.some(
    (tx) => tx.recurring_income_id === income.id && isInMonth(tx.date, ref),
  );
}

export function isRecurringExpenseRealized(
  expense: RecurringExpense,
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): boolean {
  return transactions.some(
    (tx) => tx.recurring_expense_id === expense.id && isInMonth(tx.date, ref),
  );
}

/**
 * Ir — Receita restante do mês.
 * Para o cálculo, recorrentes anuais ficam fora (engine sem `frequency` em incomes).
 */
export function getRemainingIncome(
  incomes: RecurringIncome[],
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): number {
  const day = ref.date();
  let sum = 0;
  for (const ri of incomes) {
    if (!ri.active) continue;
    if (ri.day_of_month < day) continue; // já passou no mês
    if (isRecurringIncomeRealized(ri, transactions, ref)) continue;
    sum += Number(ri.amount);
  }
  return round2(sum);
}

/**
 * Or — Obrigação restante do mês (apenas a parte de contas fixas).
 * Faturas de cartão são somadas em `credit-cards.ts` e agregadas em `budget.ts`.
 *
 * Anuais (frequency='yearly') só contam quando o mês de `ref` coincide com `due_month`.
 * O CHECK do banco garante que `due_month` existe para 'yearly'.
 */
export function getRemainingRecurringExpenses(
  expenses: RecurringExpense[],
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): number {
  const day = ref.date();
  const month = ref.month() + 1; // 1..12
  let sum = 0;
  for (const re of expenses) {
    if (!re.active) continue;
    if (re.due_day < day) continue;
    if (re.frequency === 'yearly' && re.due_month !== month) continue;
    if (isRecurringExpenseRealized(re, transactions, ref)) continue;
    sum += Number(re.amount);
  }
  return round2(sum);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
