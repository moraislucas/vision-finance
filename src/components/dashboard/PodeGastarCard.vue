<script setup lang="ts">
/**
 * Pode Gastar — Card neutro com toggle dia/semana/mês.
 *
 * Lê `monthly_savings_target` das settings para descontar a margem de poupança
 * automática antes de calcular o budget. Mostra a margem explicitamente.
 */
import { computed, ref } from 'vue';
import { useDataStore } from '@/stores/data';
import { resolvePaymentCategoryId, getBudgetBreakdown } from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { TrendingUp, AlertTriangle, PiggyBank } from '@lucide/vue';
import Card from '@/components/ui/Card.vue';

const data = useDataStore();
type Mode = 'day' | 'week' | 'month';
const mode = ref<Mode>('day');

const savingsBuffer = computed(() => data.settings?.monthly_savings_target ?? 0);

const breakdown = computed(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getBudgetBreakdown(
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
    paymentCategoryId,
    undefined,
    { savingsBuffer: savingsBuffer.value },
  );
});

const currentValue = computed(() =>
  mode.value === 'day'
    ? breakdown.value.dailyBudget
    : mode.value === 'week'
      ? breakdown.value.weeklyBudget
      : breakdown.value.monthlyBudget,
);

const subtitle = computed(() =>
  mode.value === 'day'
    ? 'pode gastar hoje'
    : mode.value === 'week'
      ? 'esta semana'
      : 'no resto do mês',
);

const footer = computed(() => {
  const dr = breakdown.value.daysRemaining;
  return `${dr} dia${dr === 1 ? '' : 's'} restante${dr === 1 ? '' : 's'}`;
});

const tabs: { id: Mode; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
];
</script>

<template>
  <Card padded class="relative flex h-full flex-col overflow-hidden">
    <!-- Eyebrow + toggle -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <p
          class="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          <TrendingUp class="size-3 text-primary" />
          Pode Gastar
        </p>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ subtitle }}</p>
      </div>
      <div
        class="inline-flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60"
      >
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          :class="[
            'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
            mode === t.id
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="mode = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- Valor gigante -->
    <div class="mt-5 flex items-baseline gap-2">
      <span class="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums">
        {{ formatCurrency(currentValue) }}
      </span>
    </div>

    <!-- Alerta: mês apertado (não cobre margem de poupança) -->
    <div
      v-if="breakdown.savingsShortfall"
      class="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning"
    >
      <AlertTriangle class="mt-0.5 size-4 shrink-0" />
      <p>
        Mês apertado: sobra projetada ({{ formatCurrency(breakdown.freeBalanceMonth) }})
        está abaixo da sua margem de poupança ({{ formatCurrency(breakdown.savingsTarget) }}).
        Reduza gastos ou ajuste a margem em Configurações.
      </p>
    </div>

    <!-- Decomposição rápida -->
    <div class="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-xs">
      <div>
        <div
          class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          Saldo hoje
        </div>
        <div class="mt-0.5 text-sm font-medium tabular-nums">
          {{ formatCurrency(breakdown.B0) }}
        </div>
      </div>
      <div>
        <div
          class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          Sobra do mês
        </div>
        <div class="mt-0.5 text-sm font-medium tabular-nums">
          {{ formatCurrency(Math.max(0, breakdown.freeBalanceMonth)) }}
        </div>
      </div>
      <div v-if="breakdown.savingsApplied > 0">
        <div
          class="flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-success/80 font-medium"
        >
          <PiggyBank class="size-3" />
          Poupança
        </div>
        <div class="mt-0.5 text-sm font-medium tabular-nums text-success">
          {{ formatCurrency(breakdown.savingsApplied) }}
        </div>
      </div>
      <div v-else>
        <div
          class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          Projetado
        </div>
        <div
          class="mt-0.5 text-sm font-medium tabular-nums"
          :class="
            breakdown.projectedMonthEnd < 0 ? 'text-destructive' : 'text-foreground'
          "
        >
          {{ formatCurrency(breakdown.projectedMonthEnd) }}
        </div>
      </div>
    </div>

    <p class="mt-3 text-[11px] text-muted-foreground">{{ footer }}</p>
  </Card>
</template>
