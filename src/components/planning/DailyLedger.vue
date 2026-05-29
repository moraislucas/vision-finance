<script setup lang="ts">
/**
 * Saldo dia a dia — tabela vertical (Dia / Diário / Saldo) para o mês recebido
 * em `monthRef`. NÃO controla o estado do mês — quem faz isso é o MonthlyView.
 */
import { computed, ref, watch, nextTick } from 'vue';
import { useDataStore } from '@/stores/data';
import {
  getMonthDailyProjection,
  resolvePaymentCategoryId,
  type DailyLedgerRow,
} from '@/lib/finance';
import { today, type Dayjs } from '@/lib/helpers/date';
import { formatCurrency } from '@/lib/helpers/format';

const props = defineProps<{ monthRef: Dayjs }>();
const data = useDataStore();

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

function balanceCellClass(value: number): string {
  if (value <= -500) return 'bg-destructive/30 text-destructive';
  if (value < 0) return 'bg-destructive/15 text-destructive';
  if (value < 500) return 'bg-warning/15 text-warning';
  return 'bg-success/15 text-success';
}

function diarioClass(row: DailyLedgerRow): string {
  if (row.isFuture) return 'text-muted-foreground';
  return 'text-foreground';
}

const todayRowEl = ref<HTMLElement | null>(null);

const isCurrentMonth = computed(
  () =>
    props.monthRef.year() === today().year() &&
    props.monthRef.month() === today().month(),
);

watch(
  () => projection.value.month,
  async () => {
    await nextTick();
    if (isCurrentMonth.value) {
      todayRowEl.value?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <!-- Resumo do mês -->
    <div class="grid grid-cols-3 gap-2 text-xs">
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Início
        </div>
        <div class="mt-0.5 tabular-nums text-sm font-semibold">
          {{ formatCurrency(projection.startingBalance) }}
        </div>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Diário
        </div>
        <div class="mt-0.5 tabular-nums text-sm font-semibold">
          {{ formatCurrency(projection.dailyBudget) }}
        </div>
      </div>
      <div class="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Fim
        </div>
        <div
          class="mt-0.5 tabular-nums text-sm font-semibold"
          :class="projection.endingBalance < 0 ? 'text-destructive' : 'text-foreground'"
        >
          {{ formatCurrency(projection.endingBalance) }}
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div class="max-h-[520px] overflow-y-auto rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr
            class="border-b border-border text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80"
          >
            <th class="px-3 py-2 text-left w-14">Dia</th>
            <th class="px-3 py-2 text-right">Diário</th>
            <th class="px-3 py-2 text-right w-32">Saldo</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in projection.rows"
            :key="row.date"
            :ref="(el) => { if (row.isToday) todayRowEl = el as HTMLElement }"
            class="border-b border-border/60 last:border-0"
            :class="row.isToday ? 'bg-foreground/[0.03]' : ''"
          >
            <td class="px-3 py-2.5">
              <div class="flex items-center gap-2">
                <span
                  class="inline-grid size-7 place-items-center rounded-lg text-xs font-semibold tabular-nums"
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
                <span
                  v-if="row.isToday"
                  class="text-[10px] uppercase tracking-[0.16em] text-foreground/80 font-medium"
                >
                  hoje
                </span>
              </div>
            </td>
            <td class="px-3 py-2.5 text-right tabular-nums" :class="diarioClass(row)">
              <span v-if="row.discretionary > 0">
                {{ formatCurrency(row.discretionary) }}
              </span>
              <span v-else class="text-muted-foreground/60">—</span>
            </td>
            <td class="px-2 py-2">
              <span
                class="block rounded-md px-2 py-1 text-right tabular-nums font-medium"
                :class="balanceCellClass(row.endBalance)"
              >
                {{ formatCurrency(row.endBalance) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[11px] text-muted-foreground">
      Dias passados usam suas transações reais. Dias futuros descontam o
      orçamento diário planejado + recorrentes/faturas que caem no dia.
    </p>
  </div>
</template>
