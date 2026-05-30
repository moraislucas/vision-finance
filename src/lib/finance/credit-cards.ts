/**
 * Cartão de crédito — cronograma de parcelas e faturas (seção 9.4).
 *
 * Regra do ciclo (input: purchase_date, closing_day, due_day):
 *   - Se purchase_date.dia <= closing_day → fecha no closing_day DESTE mês.
 *   - Caso contrário → fecha no closing_day do MÊS SEGUINTE.
 * A parcela k (0-based) cai no ciclo (base + k meses).
 *
 * Vencimento do ciclo:
 *   - Se due_day > closing_day → vence no MESMO mês do fechamento.
 *   - Caso contrário          → vence no MÊS SEGUINTE ao fechamento.
 *
 * `valorParcela = total / installments` (arredondado); a ÚLTIMA ajusta centavos
 * para que a soma das parcelas seja exatamente `total_amount`.
 */
import type {
  Category,
  CreditCard,
  CreditCardPurchase,
  Transaction,
} from '@/types/domain';
import {
  dayjs,
  safeDateInMonth,
  today as todayHelper,
  type Dayjs,
} from '@/lib/helpers/date';
import type { Invoice, InvoiceLine } from './types';

/**
 * Resolve a categoria de pagamento de fatura ("Cartão") a partir do array de
 * categorias do household. Faz match case-insensitive em pt-BR — robusto a
 * variações ("cartão", "Cartão", "Cartao"). Retorna `null` quando ausente,
 * caso em que `getRemainingCardInvoices` cai num matcher mais frouxo (por valor).
 */
export function resolvePaymentCategoryId(categories: Category[]): string | null {
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  const hit = categories.find((c) => c.type === 'expense' && norm(c.name) === 'cartao');
  return hit?.id ?? null;
}

/**
 * Valores de cada parcela. A última corrige o resíduo para fechar com `total`.
 * Array tem `installments` elementos.
 */
export function getInstallmentAmounts(purchase: CreditCardPurchase): number[] {
  const total = Number(purchase.total_amount);
  const n = Math.max(1, purchase.installments);
  if (n === 1) return [round2(total)];
  const each = Math.floor((total / n) * 100) / 100;
  const arr = new Array<number>(n).fill(each);
  const sum = round2(each * n);
  const diff = round2(total - sum);
  arr[n - 1] = round2(each + diff);
  return arr;
}

/** Mês/ano em que a parcela `k` (0-based) FECHA, dado o cartão. */
function closingMonthFor(purchase: CreditCardPurchase, card: CreditCard, k: number): Dayjs {
  const pd = dayjs(purchase.purchase_date);
  // Ciclo-base: mês atual se compra <= closing_day, senão mês seguinte.
  const baseShift = pd.date() <= card.closing_day ? 0 : 1;
  return pd.startOf('month').add(baseShift + k, 'month');
}

/**
 * Data exata de VENCIMENTO da parcela `k` (0-based) — seção 9.4.
 */
export function getInstallmentDueDate(
  purchase: CreditCardPurchase,
  card: CreditCard,
  installmentIndex: number,
): string {
  const closingMonth = closingMonthFor(purchase, card, installmentIndex);
  // Se due_day > closing_day → vence no MESMO mês do fechamento; senão no MÊS SEGUINTE.
  const dueMonthShift = card.due_day > card.closing_day ? 0 : 1;
  const dueMonth = closingMonth.add(dueMonthShift, 'month');
  return safeDateInMonth(dueMonth.year(), dueMonth.month(), card.due_day).format('YYYY-MM-DD');
}

/**
 * Data de compra que faz uma compra à vista (1 parcela) cair na fatura cujo
 * VENCIMENTO é no mês `invoiceYM` (YYYY-MM). Útil para "lançar a fatura do mês"
 * sem o usuário pensar em data/ciclo.
 *
 * Raciocínio inverso da regra do ciclo: escolhemos o dia 1 (sempre <= closing_day,
 * baseShift=0), então closingMonth = mês da compra. Como
 * dueMonth = closingMonth + dueMonthShift, basta recuar `dueMonthShift` meses.
 */
export function purchaseDateForInvoiceMonth(card: CreditCard, invoiceYM: string): string {
  const dueMonthShift = card.due_day > card.closing_day ? 0 : 1;
  const purchaseMonth = dayjs(`${invoiceYM}-01`).subtract(dueMonthShift, 'month');
  return safeDateInMonth(purchaseMonth.year(), purchaseMonth.month(), 1).format('YYYY-MM-DD');
}

/** Todas as parcelas (k=0..N-1) de uma compra, expandidas em `InvoiceLine`. */
export function expandPurchase(
  purchase: CreditCardPurchase,
  card: CreditCard,
): InvoiceLine[] {
  const amounts = getInstallmentAmounts(purchase);
  return amounts.map((amount, k) => ({
    purchaseId: purchase.id,
    description: purchase.description,
    installment: k + 1,
    totalInstallments: amounts.length,
    amount,
    dueDate: getInstallmentDueDate(purchase, card, k),
  }));
}

/**
 * Fatura de um mês para um cartão. `month` pode ser `Dayjs` ou string `YYYY-MM`.
 */
export function getCardInvoice(
  card: CreditCard,
  purchases: CreditCardPurchase[],
  month: Dayjs | string,
): Invoice {
  const target = typeof month === 'string' ? dayjs(`${month}-01`) : month.startOf('month');
  const targetYM = target.format('YYYY-MM');
  const lines: InvoiceLine[] = [];
  for (const p of purchases) {
    if (p.credit_card_id !== card.id) continue;
    for (const line of expandPurchase(p, card)) {
      if (line.dueDate.startsWith(targetYM)) lines.push(line);
    }
  }
  const total = round2(lines.reduce((s, l) => s + l.amount, 0));
  return { cardId: card.id, month: targetYM, total, lines };
}

/**
 * V1 simples (seção 9.4): fatura está paga se existe transaction no mês de
 * vencimento, com categoria "Cartão" (resolvida pelo chamador) ou — pragmático —
 * com valor >= fatura. Aqui aceitamos um array de transactions já filtradas
 * pelo chamador (categoria + cartão), ou usamos um match por valor.
 *
 * Esta função fica deliberadamente liberal: o chamador injeta as transactions
 * candidatas; nós verificamos se alguma cobre o valor.
 */
export function isInvoicePaid(invoice: Invoice, paymentCandidates: Transaction[]): boolean {
  return paymentCandidates.some(
    (tx) => tx.type === 'expense' && tx.date.startsWith(invoice.month) && Number(tx.amount) >= invoice.total,
  );
}

/**
 * Limite disponível = limit_amount − Σ (parcelas com vencimento >= ref).
 * Inclui as parcelas futuras "em aberto" — uma visão de comprometimento.
 */
export function getCardAvailableLimit(
  card: CreditCard,
  purchases: CreditCardPurchase[],
  ref: Dayjs = todayHelper(),
): number {
  const refStr = ref.format('YYYY-MM-DD');
  let committed = 0;
  for (const p of purchases) {
    if (p.credit_card_id !== card.id) continue;
    for (const line of expandPurchase(p, card)) {
      if (line.dueDate >= refStr) committed += line.amount;
    }
  }
  return round2(Number(card.limit_amount) - committed);
}

/**
 * Soma das faturas de TODOS os cartões com vencimento no mês de `ref` que ainda
 * não foram pagas, e cujo `due_day` ainda não passou.
 * Esta é a parcela de Or vinda de cartões.
 */
export function getRemainingCardInvoices(
  cards: CreditCard[],
  purchases: CreditCardPurchase[],
  transactions: Transaction[],
  paymentCategoryId: string | null,
  ref: Dayjs = todayHelper(),
): number {
  const refDay = ref.date();
  let sum = 0;
  for (const card of cards) {
    if (!card.active) continue;
    if (card.due_day < refDay) continue;
    const invoice = getCardInvoice(card, purchases, ref);
    if (invoice.total === 0) continue;
    const candidates = transactions.filter(
      (tx) =>
        tx.type === 'expense' &&
        (paymentCategoryId == null || tx.category_id === paymentCategoryId),
    );
    if (isInvoicePaid(invoice, candidates)) continue;
    sum += invoice.total;
  }
  return round2(sum);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
