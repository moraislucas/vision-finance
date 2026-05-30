/**
 * Saldos atuais e disponível (seção 9.1, 9.3).
 *
 *   B0 = Σ accountBalance(a) para a com include_in_available
 *   R  = Σ goal.current_amount (metas ativas)  — "reservado"
 *   Disponível agora = B0 − R
 */
import type { Account, Goal, Transaction } from '@/types/domain';
import { dayjs, today as todayHelper, type Dayjs } from '@/lib/helpers/date';

/** Saldo de uma conta = initial + receitas − despesas até `ref` (inclusive). */
export function getAccountBalance(
  account: Account,
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): number {
  const refStr = ref.format('YYYY-MM-DD');
  let balance = Number(account.initial_balance);
  for (const tx of transactions) {
    if (tx.account_id !== account.id) continue;
    if (tx.date > refStr) continue; // apenas até `ref` inclusive
    const amount = Number(tx.amount);
    balance += tx.type === 'income' ? amount : -amount;
  }
  return round2(balance);
}

/** B0 — Saldo Atual total (apenas contas com include_in_available). */
export function getCurrentBalance(
  accounts: Account[],
  transactions: Transaction[],
  ref: Dayjs = todayHelper(),
): number {
  return round2(
    accounts
      .filter((a) => a.include_in_available)
      .reduce((sum, a) => sum + getAccountBalance(a, transactions, ref), 0),
  );
}

/** R — Reservado (já earmarcado em metas ativas). */
export function getReserved(goals: Goal[]): number {
  return round2(
    goals
      .filter((g) => g.active)
      .reduce((sum, g) => sum + Number(g.current_amount), 0),
  );
}

/** Disponível agora = B0 − R (seção 3). */
export function getAvailableNow(
  accounts: Account[],
  transactions: Transaction[],
  goals: Goal[],
  ref: Dayjs = todayHelper(),
): number {
  return round2(getCurrentBalance(accounts, transactions, ref) - getReserved(goals));
}

/** Centaveiro: arredonda para 2 casas evitando arrastar erro float. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Re-export para que módulos da Engine evitem importar dayjs solto.
export { dayjs };
