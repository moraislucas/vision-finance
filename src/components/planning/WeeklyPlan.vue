<script setup lang="ts">
/**
 * WeeklyPlan — "Ritmo do mês". Mostra o mês agrupado por semana com
 * orçamento × gasto × sobra, para responder "estou no ritmo do meu plano de
 * poupança?". Cada semana expande para os dias (orçamento/gasto/saldo).
 *
 * Não controla o estado do mês — recebe via prop (quem controla é MonthlyView).
 */
import { computed, ref, watch } from 'vue';
import { ChevronDown } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getMonthWeeklyProjection,
  resolvePaymentCategoryId,
  type WeekSummary,
} from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { dayjs, type Dayjs } from '@/lib/helpers/date';
import { cn } from '@/lib/utils';

const props = defineProps<{ monthRef: Dayjs }>();
const data = useDataStore();

const savingsBuffer = computed(() => data.settings?.monthly_savings_target ?? 0);

const projection = computed(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getMonthWeeklyProjection(
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

// Semana expandida (default: a que contém hoje, senão a primeira).
const expanded = ref<number | null>(null);
watch(
  projection,
  (p) => {
    const todayWeek = p.weeks.find((w) => w.containsToday);
    expanded.value = todayWeek?.index ?? p.weeks[0]?.index ?? null;
  },
  { immediate: true },
);
function toggle(i: number) {
  expanded.value = expanded.value === i ? null : i;
}

function weekLabel(w: WeekSummary): string {
  const s = dayjs(w.startDate);
  const e = dayjs(w.endDate);
  return `${s.format('D')}–${e.format('D')} ${e.format('MMM')}`;
}

function progress(w: WeekSummary): number {
  if (w.budget <= 0) return 0;
  return Math.max(0, Math.min(1, w.spent / w.budget));
}

const statusMeta: Record<WeekSummary['status'], { label: string; chip: string; bar: string }> = {
  future: {
    label: 'planejado',
    chip: 'bg-secondary/60 text-muted-foreground',
    bar: 'bg-muted-foreground/40',
  },
  'on-track': {
    label: 'dentro do plano',
    chip: 'bg-success/15 text-success',
    bar: 'bg-success',
  },
  over: {
    label: 'acima do plano',
    chip: 'bg-destructive/15 text-destructive',
    bar: 'bg-destructive',
  },
};

function balanceTone(value: number): string {
  if (value < 0) return 'text-destructive';
  if (value < 500) return 'text-warning';
  return 'text-foreground';
}
</script>

<template>
  <div class="space-y-3">
    <!-- Resumo do mês -->
    <div class="grid grid-cols-3 gap-2 text-xs">
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">Por dia</div>
        <div class="mt-0.5 tabular-nums text-sm font-semibold">
          {{ formatCurrency(projection.dailyBudget) }}
        </div>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">Início</div>
        <div class="mt-0.5 tabular-nums text-sm font-semibold">
          {{ formatCurrency(projection.startingBalance) }}
        </div>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">Fim</div>
        <div
          class="mt-0.5 tabular-nums text-sm font-semibold"
          :class="projection.endingBalance < 0 ? 'text-destructive' : 'text-foreground'"
        >
          {{ formatCurrency(projection.endingBalance) }}
        </div>
      </div>
    </div>

    <!-- Semanas -->
    <ul class="space-y-2">
      <li
        v-for="w in projection.weeks"
        :key="w.index"
        :class="
          cn(
            'overflow-hidden rounded-xl border',
            w.containsToday ? 'border-primary/60' : 'border-border',
          )
        "
      >
        <button
          type="button"
          class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/30"
          :aria-expanded="expanded === w.index"
          @click="toggle(w.index)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold capitalize">Semana {{ w.index + 1 }}</span>
              <span class="text-[11px] text-muted-foreground">{{ weekLabel(w) }}</span>
              <span
                v-if="w.containsToday"
                class="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-primary"
              >
                hoje
              </span>
            </div>
            <!-- Barra orçamento × gasto -->
            <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
              <div
                class="h-full transition-[width]"
                :class="statusMeta[w.status].bar"
                :style="{ width: `${progress(w) * 100}%` }"
              />
            </div>
            <div class="mt-1 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>
                <span v-if="!w.isFuture">gasto {{ formatCurrency(w.spent) }} · </span>
                orçamento {{ formatCurrency(w.budget) }}
              </span>
              <span :class="w.remaining < 0 ? 'text-destructive' : 'text-success'">
                {{ w.remaining < 0 ? 'estourou' : 'sobra' }}
                {{ formatCurrency(Math.abs(w.remaining)) }}
              </span>
            </div>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span
              :class="cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusMeta[w.status].chip)"
            >
              {{ statusMeta[w.status].label }}
            </span>
            <ChevronDown
              class="size-4 text-muted-foreground transition-transform"
              :class="expanded === w.index ? 'rotate-180' : ''"
            />
          </div>
        </button>

        <!-- Dias da semana -->
        <div v-if="expanded === w.index" class="border-t border-border/60 bg-background/40">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
                <th class="px-3 py-1.5 text-left w-12">Dia</th>
                <th class="px-3 py-1.5 text-right">Orçamento</th>
                <th class="px-3 py-1.5 text-right">Gasto</th>
                <th class="px-3 py-1.5 text-right w-24">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in w.days"
                :key="row.date"
                class="border-t border-border/40"
                :class="row.isToday ? 'bg-foreground/[0.03]' : ''"
              >
                <td class="px-3 py-2">
                  <span
                    class="inline-grid size-6 place-items-center rounded-md text-[11px] font-semibold tabular-nums"
                    :class="
                      row.isToday
                        ? 'bg-foreground text-background'
                        : row.isPast
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                    "
                  >
                    {{ row.day }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {{ formatCurrency(row.budget) }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  <span v-if="!row.isFuture">{{ formatCurrency(row.spent) }}</span>
                  <span v-else class="text-muted-foreground/50">—</span>
                </td>
                <td class="px-3 py-2 text-right tabular-nums font-medium" :class="balanceTone(row.endBalance)">
                  {{ formatCurrency(row.endBalance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </li>
    </ul>

    <p class="text-[11px] text-muted-foreground">
      Orçamento = ritmo diário do seu plano de poupança. Gasto = despesas
      variáveis já lançadas (dias passados). Sobra verde = dentro do plano.
    </p>
  </div>
</template>
