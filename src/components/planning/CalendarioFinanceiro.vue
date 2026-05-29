<script setup lang="ts">
/**
 * Calendário financeiro do mês — receitas (verde), contas fixas (vermelho),
 * faturas de cartão (azul) e aportes (roxo) aparecem nos dias.
 */
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { dayjs, today } from '@/lib/helpers/date';
import { getCardInvoice } from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';

interface CalendarEvent {
  kind: 'income' | 'expense' | 'invoice' | 'contribution';
  label: string;
  amount: number;
}

const data = useDataStore();
const ref = computed(() => today());
const month = computed(() => ref.value.format('YYYY-MM'));
const daysInMonth = computed(() => ref.value.daysInMonth());
const firstDayWeekday = computed(() => ref.value.startOf('month').day()); // 0 = domingo

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
  const currentMonth = ref.value.month() + 1;
  for (const re of data.recurringExpenses) {
    if (!re.active) continue;
    if (re.frequency === 'yearly' && re.due_month !== currentMonth) continue;
    push(re.due_day, { kind: 'expense', label: re.name, amount: Number(re.amount) });
  }
  for (const card of data.creditCards) {
    if (!card.active) continue;
    const inv = getCardInvoice(card, data.creditCardPurchases, ref.value);
    if (inv.total > 0) {
      push(card.due_day, { kind: 'invoice', label: `Fatura ${card.name}`, amount: inv.total });
    }
  }
  for (const gc of data.goalContributions) {
    if (!gc.date.startsWith(month.value)) continue;
    const goal = data.goals.find((g) => g.id === gc.goal_id);
    push(Number(gc.date.slice(8, 10)), {
      kind: 'contribution',
      label: goal?.name ?? 'Meta',
      amount: Number(gc.amount),
    });
  }
  return map;
});

const todayDay = computed(() => ref.value.date());

const cells = computed(() => {
  const out: { day: number | null; events: CalendarEvent[] }[] = [];
  for (let i = 0; i < firstDayWeekday.value; i++) out.push({ day: null, events: [] });
  for (let d = 1; d <= daysInMonth.value; d++) {
    out.push({ day: d, events: eventsByDay.value.get(d) ?? [] });
  }
  return out;
});

const colorFor = (k: CalendarEvent['kind']): string =>
  ({
    income: 'bg-success/20 text-success',
    expense: 'bg-destructive/20 text-destructive',
    invoice: 'bg-primary/20 text-primary',
    contribution: 'bg-accent/20 text-accent',
  })[k];

function _useDayjs() {
  void dayjs;
}
void _useDayjs;
</script>

<template>
  <div>
    <div class="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <div v-for="w in weekdays" :key="w">{{ w }}</div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        :class="[
          'min-h-[64px] rounded-md border border-border p-1.5 text-left text-xs',
          cell.day === null ? 'opacity-30 border-dashed' : '',
          cell.day === todayDay ? 'border-primary/60 bg-primary/5' : 'bg-card',
        ]"
      >
        <div v-if="cell.day !== null" class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-muted-foreground">{{ cell.day }}</span>
          <span v-if="cell.day === todayDay" class="rounded-full bg-primary px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary-foreground">hoje</span>
        </div>
        <ul v-if="cell.events.length" class="mt-1 space-y-0.5">
          <li
            v-for="(e, j) in cell.events.slice(0, 2)"
            :key="j"
            :class="['truncate rounded-sm px-1 py-0.5 text-[10px]', colorFor(e.kind)]"
            :title="`${e.label} · ${formatCurrency(Math.abs(e.amount))}`"
          >
            {{ e.label }}
          </li>
          <li v-if="cell.events.length > 2" class="px-1 text-[10px] text-muted-foreground">
            +{{ cell.events.length - 2 }}
          </li>
        </ul>
      </div>
    </div>
    <ul class="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
      <li class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-success" /> Receitas</li>
      <li class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-destructive" /> Contas fixas</li>
      <li class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-primary" /> Faturas</li>
      <li class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-accent" /> Aportes</li>
    </ul>
  </div>
</template>
