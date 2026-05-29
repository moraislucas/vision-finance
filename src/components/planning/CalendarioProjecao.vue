<script setup lang="ts">
/**
 * Calendário híbrido — grid 7×N de dias do mês, cada célula mostrando:
 *   - número do dia (com destaque pra hoje),
 *   - até 2 chips de eventos (receita / despesa / fatura / aporte),
 *   - saldo projetado ao FIM do dia (colorido com tom semafórico).
 *
 * É o casamento entre CalendarioFinanceiro (visão de eventos) e DailyLedger
 * (projeção diária de saldo). NÃO controla o estado do mês — recebe via prop.
 */
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import {
  getCardInvoice,
  getMonthDailyProjection,
  resolvePaymentCategoryId,
} from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { today, type Dayjs } from '@/lib/helpers/date';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip.vue';

interface CalendarEvent {
  kind: 'income' | 'expense' | 'invoice' | 'contribution';
  label: string;
  amount: number;
}

interface DayCell {
  day: number | null;
  date?: string;
  isPast?: boolean;
  isToday?: boolean;
  isFuture?: boolean;
  endBalance?: number;
  events?: CalendarEvent[];
}

const props = defineProps<{ monthRef: Dayjs }>();
const data = useDataStore();

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const monthYM = computed(() => props.monthRef.format('YYYY-MM'));
const monthIndex0 = computed(() => props.monthRef.month()); // 0..11
const daysInMonth = computed(() => props.monthRef.daysInMonth());
const firstWeekday = computed(() => props.monthRef.startOf('month').day()); // 0=Dom

const savingsBuffer = computed(() => data.settings?.monthly_savings_target ?? 0);

const projection = computed(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getMonthDailyProjection(
    {
      accounts: data.accounts,
      transactions: data.transactions,
      recurringIncomes: data.recurringIncomes,
      recurringExpenses: data.recurringExpenses,
      goals: data.goals,
      goalContributions: data.goalContributions,
      creditCards: data.creditCards,
      creditCardPurchases: data.creditCardPurchases,
      categories: data.categories,
    },
    props.monthRef,
    paymentCategoryId,
    undefined,
    { savingsBuffer: savingsBuffer.value },
  );
});

const eventsByDay = computed(() => {
  const map = new Map<number, CalendarEvent[]>();
  const push = (day: number, evt: CalendarEvent) => {
    const arr = map.get(day) ?? [];
    arr.push(evt);
    map.set(day, arr);
  };

  for (const ri of data.recurringIncomes) {
    if (!ri.active) continue;
    push(ri.day_of_month, { kind: 'income', label: ri.name, amount: Number(ri.amount) });
  }
  const currentMonth = monthIndex0.value + 1;
  for (const re of data.recurringExpenses) {
    if (!re.active) continue;
    if (re.frequency === 'yearly' && re.due_month !== currentMonth) continue;
    push(re.due_day, { kind: 'expense', label: re.name, amount: Number(re.amount) });
  }
  for (const card of data.creditCards) {
    if (!card.active) continue;
    const inv = getCardInvoice(card, data.creditCardPurchases, props.monthRef);
    if (inv.total > 0) {
      push(card.due_day, { kind: 'invoice', label: `Fatura ${card.name}`, amount: inv.total });
    }
  }
  for (const gc of data.goalContributions) {
    if (!gc.date.startsWith(monthYM.value)) continue;
    const goal = data.goals.find((g) => g.id === gc.goal_id);
    push(Number(gc.date.slice(8, 10)), {
      kind: 'contribution',
      label: goal?.name ?? 'Meta',
      amount: Number(gc.amount),
    });
  }
  return map;
});

const cells = computed<DayCell[]>(() => {
  const out: DayCell[] = [];
  for (let i = 0; i < firstWeekday.value; i++) out.push({ day: null });
  const rowsByDay = new Map(projection.value.rows.map((r) => [r.day, r]));
  for (let d = 1; d <= daysInMonth.value; d++) {
    const row = rowsByDay.get(d);
    if (!row) {
      out.push({ day: d, events: eventsByDay.value.get(d) ?? [] });
      continue;
    }
    out.push({
      day: d,
      date: row.date,
      isPast: row.isPast,
      isToday: row.isToday,
      isFuture: row.isFuture,
      endBalance: row.endBalance,
      events: eventsByDay.value.get(d) ?? [],
    });
  }
  return out;
});

const eventChip = (k: CalendarEvent['kind']): string =>
  ({
    income: 'bg-success/20 text-success',
    expense: 'bg-destructive/20 text-destructive',
    invoice: 'bg-primary/20 text-primary',
    contribution: 'bg-accent/20 text-accent',
  })[k];

const eventDot = (k: CalendarEvent['kind']): string =>
  ({
    income: 'bg-success',
    expense: 'bg-destructive',
    invoice: 'bg-primary',
    contribution: 'bg-accent',
  })[k];

/** Tom da pílula de saldo do dia. */
function balanceTone(value: number | undefined): string {
  if (value === undefined) return 'text-muted-foreground/40';
  if (value <= -500) return 'bg-destructive/25 text-destructive';
  if (value < 0) return 'bg-destructive/10 text-destructive';
  if (value < 500) return 'bg-warning/15 text-warning';
  return 'bg-success/15 text-success';
}

const isCurrentMonth = computed(
  () =>
    props.monthRef.year() === today().year() &&
    props.monthRef.month() === today().month(),
);
void isCurrentMonth;
</script>

<template>
  <div>
    <!-- Cabeçalho dos dias da semana -->
    <div
      class="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80"
    >
      <div v-for="w in weekdays" :key="w">{{ w }}</div>
    </div>

    <!-- Grid de dias -->
    <div class="grid grid-cols-7 gap-1.5">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        :class="
          cn(
            'flex min-h-[88px] flex-col gap-1.5 rounded-xl border p-1.5 text-left text-xs transition-colors',
            cell.day === null && 'border-dashed border-border/40 opacity-30',
            cell.day !== null &&
              cell.isToday &&
              'border-primary bg-primary/[0.06] shadow-primary-glow/30',
            cell.day !== null &&
              !cell.isToday &&
              'border-border bg-card hover:border-border/80',
          )
        "
      >
        <template v-if="cell.day !== null">
          <!-- Header: número do dia + chips de eventos (dots compactos) -->
          <div class="flex items-center justify-between">
            <span
              :class="
                cn(
                  'inline-grid size-6 place-items-center rounded-md text-[11px] font-semibold tabular-nums',
                  cell.isToday
                    ? 'bg-foreground text-background'
                    : cell.isPast
                      ? 'text-muted-foreground'
                      : 'text-foreground',
                )
              "
            >
              {{ cell.day }}
            </span>
            <div v-if="cell.events && cell.events.length" class="flex gap-0.5">
              <Tooltip
                v-for="(e, j) in cell.events.slice(0, 3)"
                :key="j"
                :text="`${e.label} · ${formatCurrency(Math.abs(e.amount))}`"
              >
                <span :class="['size-1.5 rounded-full', eventDot(e.kind)]" />
              </Tooltip>
              <span
                v-if="cell.events.length > 3"
                class="text-[9px] text-muted-foreground"
              >
                +{{ cell.events.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Lista compacta de eventos (apenas md+) -->
          <ul v-if="cell.events && cell.events.length" class="hidden md:block space-y-0.5">
            <li
              v-for="(e, j) in cell.events.slice(0, 2)"
              :key="j"
              :class="['truncate rounded-md px-1.5 py-0.5 text-[10px]', eventChip(e.kind)]"
              :title="`${e.label} · ${formatCurrency(Math.abs(e.amount))}`"
            >
              {{ e.label }}
            </li>
            <li
              v-if="cell.events.length > 2"
              class="px-1.5 text-[9px] text-muted-foreground/70"
            >
              +{{ cell.events.length - 2 }} eventos
            </li>
          </ul>

          <!-- Saldo do dia (pílula colorida ancorada no rodapé do cell) -->
          <div
            v-if="cell.endBalance !== undefined"
            :class="
              cn(
                'mt-auto rounded-md px-1.5 py-1 text-center text-[10.5px] font-medium tabular-nums',
                balanceTone(cell.endBalance),
              )
            "
          >
            {{ formatCurrency(cell.endBalance) }}
          </div>
        </template>
      </div>
    </div>

    <!-- Legendas -->
    <ul
      class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground"
    >
      <li class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-success" /> Receitas
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-destructive" /> Contas fixas
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-primary" /> Faturas
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-accent" /> Aportes
      </li>
      <li class="ml-auto flex items-center gap-2">
        <span class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
          saldo
        </span>
        <span class="rounded-sm bg-success/15 px-1.5 py-0.5 text-success">positivo</span>
        <span class="rounded-sm bg-warning/15 px-1.5 py-0.5 text-warning">baixo</span>
        <span class="rounded-sm bg-destructive/15 px-1.5 py-0.5 text-destructive">
          negativo
        </span>
      </li>
    </ul>
  </div>
</template>
