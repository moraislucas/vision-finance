import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import {
  getAccountBalance,
  getAvailableNow,
  getCurrentBalance,
  getReserved,
} from '@/lib/finance';
import { makeAccount, makeGoal, makeTransaction } from './helpers';

const REF = dayjs.tz('2025-06-10', 'America/Sao_Paulo').startOf('day');

describe('balance', () => {
  it('soma initial_balance + receitas − despesas até hoje', () => {
    const acc = makeAccount({ id: 'a1', initial_balance: 1000 });
    const txs = [
      makeTransaction({ account_id: 'a1', type: 'income', amount: 500, date: '2025-06-01' }),
      makeTransaction({ account_id: 'a1', type: 'expense', amount: 200, date: '2025-06-09' }),
      // depois de REF — não conta:
      makeTransaction({ account_id: 'a1', type: 'expense', amount: 999, date: '2025-06-20' }),
    ];
    expect(getAccountBalance(acc, txs, REF)).toBe(1300);
  });

  it('B0 ignora contas com include_in_available=false', () => {
    const a = makeAccount({ id: 'a', initial_balance: 1000, include_in_available: true });
    const b = makeAccount({ id: 'b', initial_balance: 5000, include_in_available: false });
    expect(getCurrentBalance([a, b], [], REF)).toBe(1000);
  });

  it('R = soma de current_amount das metas ativas', () => {
    const g1 = makeGoal({ current_amount: 300, active: true });
    const g2 = makeGoal({ current_amount: 700, active: true });
    const g3 = makeGoal({ current_amount: 999, active: false });
    expect(getReserved([g1, g2, g3])).toBe(1000);
  });

  it('Disponível agora = B0 − R', () => {
    const acc = makeAccount({ id: 'a', initial_balance: 2000, include_in_available: true });
    const goal = makeGoal({ current_amount: 800, active: true });
    expect(getAvailableNow([acc], [], [goal], REF)).toBe(1200);
  });
});
