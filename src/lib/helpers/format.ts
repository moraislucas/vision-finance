/**
 * Formatadores — usar SEMPRE estes helpers em vez de `Intl.NumberFormat` solto.
 * Garante consistência (BRL/pt-BR) e facilita troca futura.
 */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const compact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** Formata valor monetário em BRL (R$ 1.234,56). */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return brl.format(0);
  return brl.format(value);
}

/** Formata valores grandes de forma compacta (1,2k / 3,4M). */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Formata fração 0..1 como percentual. */
export function formatPercent(fraction: number): string {
  return percent.format(fraction);
}

/** Data DD/MM/YYYY. */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// === Máscara BRL para inputs ================================================

/**
 * Aplica máscara R$ X.XXX,XX a partir de uma string de dígitos.
 *
 *   maskCurrencyBRL('')      → ''
 *   maskCurrencyBRL('5')     → 'R$ 0,05'
 *   maskCurrencyBRL('123')   → 'R$ 1,23'
 *   maskCurrencyBRL('150000')→ 'R$ 1.500,00'
 *
 * Sempre interpreta a entrada como CENTAVOS. Útil para inputs onde o usuário
 * digita "1500" e quer ver "R$ 15,00" formatado em tempo real.
 */
export function maskCurrencyBRL(input: string | number | null | undefined): string {
  if (input == null) return '';
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte uma string mascarada de volta para número (em reais).
 *
 *   parseCurrencyBRL('R$ 1.500,00') → 1500
 *   parseCurrencyBRL('1.500,50')    → 1500.5
 *   parseCurrencyBRL('')            → 0
 */
export function parseCurrencyBRL(masked: string | null | undefined): number {
  if (!masked) return 0;
  const digits = String(masked).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/** Remove tudo que não é dígito. Útil em outros campos numéricos puros. */
export function digitsOnly(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}
