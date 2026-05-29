/**
 * Configuração centralizada do Day.js — toda a engine e UI devem importar
 * `dayjs` daqui (ou importar este módulo no boot do app) para garantir locale
 * pt-BR + timezone America/Sao_Paulo (seção 4).
 */
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

dayjs.locale('pt-br');
dayjs.tz.setDefault('America/Sao_Paulo');

export { dayjs };
export type Dayjs = dayjs.Dayjs;

/** "Hoje" canônico — sempre meia-noite no fuso de SP. */
export function today(): Dayjs {
  return dayjs().tz('America/Sao_Paulo').startOf('day');
}

/** Total de dias no mês de `d`. */
export function daysInMonth(d: Dayjs): number {
  return d.daysInMonth();
}

/** Dias restantes no mês incluindo hoje (seção 9.5). */
export function remainingDaysInMonth(d: Dayjs = today()): number {
  return daysInMonth(d) - d.date() + 1;
}

/** Compara se duas datas estão no mesmo mês/ano. */
export function isSameMonth(a: Dayjs, b: Dayjs): boolean {
  return a.year() === b.year() && a.month() === b.month();
}

/**
 * Diferença em meses (cheios, arredondando para cima), nunca < 1.
 * Usado em `monthlyTarget` quando há `target_date` (seção 9.3).
 */
export function monthsUntil(from: Dayjs, to: Dayjs): number {
  if (!to.isAfter(from)) return 1;
  const months = to.diff(from, 'month', true);
  return Math.max(1, Math.ceil(months));
}

/** Constrói uma data segura clampando `day` ao último dia do mês. */
export function safeDateInMonth(year: number, monthIndex: number, day: number): Dayjs {
  const base = dayjs(new Date(year, monthIndex, 1)).tz('America/Sao_Paulo');
  const last = base.daysInMonth();
  return base.date(Math.min(day, last));
}
