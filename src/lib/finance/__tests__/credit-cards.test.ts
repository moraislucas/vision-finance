/**
 * Cronograma de parcelas e faturas — seção 9.4.
 */
import { describe, it, expect } from 'vitest';
import { dayjs } from '@/lib/helpers/date';
import {
  expandPurchase,
  getCardAvailableLimit,
  getCardInvoice,
  getInstallmentAmounts,
  getInstallmentDueDate,
} from '@/lib/finance';
import { makeCreditCard, makePurchase } from './helpers';

describe('cartão de crédito (seção 9.4)', () => {
  it('valores das parcelas fecham com total (última ajusta centavos)', () => {
    const p = makePurchase({ total_amount: 100, installments: 3 });
    const amounts = getInstallmentAmounts(p);
    expect(amounts).toHaveLength(3);
    const sum = amounts.reduce((s, v) => s + v, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
    // duas primeiras iguais; última recebe o resíduo
    expect(amounts[0]).toBe(amounts[1]);
  });

  it('compra ANTES do fechamento → ciclo é o mês corrente', () => {
    // Card fecha dia 25, vence dia 5. Compra dia 10 → ciclo Jan/2025.
    // due_day(5) NÃO > closing_day(25) → vence no MÊS SEGUINTE (Fev/2025).
    const card = makeCreditCard({ id: 'c1', closing_day: 25, due_day: 5 });
    const purchase = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-01-10',
      total_amount: 300,
      installments: 3,
    });
    expect(getInstallmentDueDate(purchase, card, 0)).toBe('2025-02-05');
    expect(getInstallmentDueDate(purchase, card, 1)).toBe('2025-03-05');
    expect(getInstallmentDueDate(purchase, card, 2)).toBe('2025-04-05');
  });

  it('compra DEPOIS do fechamento → ciclo é o mês seguinte', () => {
    const card = makeCreditCard({ id: 'c1', closing_day: 5, due_day: 15 });
    // Compra dia 15 (> 5) → baseShift=1 → fecha Fev. due_day(15) > closing(5) → vence Fev.
    const purchase = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-01-15',
      total_amount: 200,
      installments: 2,
    });
    expect(getInstallmentDueDate(purchase, card, 0)).toBe('2025-02-15');
    expect(getInstallmentDueDate(purchase, card, 1)).toBe('2025-03-15');
  });

  it('expandPurchase produz N linhas com 1-based installment', () => {
    const card = makeCreditCard({ id: 'c1', closing_day: 25, due_day: 5 });
    const p = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-01-10',
      total_amount: 300,
      installments: 3,
    });
    const lines = expandPurchase(p, card);
    expect(lines.map((l) => l.installment)).toEqual([1, 2, 3]);
    expect(lines.map((l) => l.totalInstallments)).toEqual([3, 3, 3]);
  });

  it('fatura de um mês = soma de todas as parcelas com vencimento naquele mês', () => {
    const card = makeCreditCard({ id: 'c1', closing_day: 25, due_day: 5 });
    const p1 = makePurchase({
      id: 'p1',
      credit_card_id: 'c1',
      purchase_date: '2025-01-10',
      total_amount: 300,
      installments: 3,
    });
    const p2 = makePurchase({
      id: 'p2',
      credit_card_id: 'c1',
      purchase_date: '2025-01-15',
      total_amount: 200,
      installments: 1,
    });
    // p1 paga 100 em Fev/Mar/Abr; p2 paga 200 em Fev.
    const invoiceFeb = getCardInvoice(card, [p1, p2], dayjs.tz('2025-02-01', 'America/Sao_Paulo'));
    expect(invoiceFeb.total).toBe(300);
    expect(invoiceFeb.lines).toHaveLength(2);

    const invoiceMar = getCardInvoice(card, [p1, p2], '2025-03');
    expect(invoiceMar.total).toBe(100);
  });

  it('compra parcelada em 12x aparece em 12 faturas consecutivas', () => {
    const card = makeCreditCard({ id: 'c1', closing_day: 25, due_day: 5 });
    const p = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-01-10',
      total_amount: 1200,
      installments: 12,
    });
    const months: string[] = [];
    for (let m = 0; m < 14; m++) {
      const ref = dayjs.tz('2025-01-01', 'America/Sao_Paulo').add(m, 'month');
      const inv = getCardInvoice(card, [p], ref);
      if (inv.total > 0) months.push(inv.month);
    }
    // Fev/2025..Jan/2026 = 12 meses.
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-02');
    expect(months[11]).toBe('2026-01');
  });

  it('limite disponível = limit_amount − parcelas a vencer >= ref', () => {
    const card = makeCreditCard({ id: 'c1', limit_amount: 5000, closing_day: 25, due_day: 5 });
    const p = makePurchase({
      credit_card_id: 'c1',
      purchase_date: '2025-01-10',
      total_amount: 300,
      installments: 3,
    });
    // Em 2025-02-06, a primeira parcela (2025-02-05) já venceu → não conta.
    const ref = dayjs.tz('2025-02-06', 'America/Sao_Paulo');
    expect(getCardAvailableLimit(card, [p], ref)).toBe(4800);
  });
});
