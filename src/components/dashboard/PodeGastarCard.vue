<script setup lang="ts">
/**
 * Pode Gastar — Card neutro com toggle dia/semana/mês.
 *
 * - Modo "dia": além do teto, mostra "já gastei hoje" + sobra (loop diário).
 * - `variant="detailed"` (Planejamento): destaque de poupança + simulador de
 *   margem (slider que recalcula o teto ao vivo).
 * - `variant="compact"` (Dashboard): link "ver de onde vem" para a decomposição.
 */
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useDataStore } from '@/stores/data';
import { useSettingsStore } from '@/stores/settings';
import { useToast } from '@/composables/useToast';
import {
  resolvePaymentCategoryId,
  getBudgetBreakdown,
  getDiscretionarySpentOnDate,
} from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { TrendingUp, AlertTriangle, PiggyBank, ArrowRight } from '@lucide/vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';

const props = withDefaults(defineProps<{ variant?: 'compact' | 'detailed' }>(), {
  variant: 'compact',
});

const data = useDataStore();
const settingsStore = useSettingsStore();
const toast = useToast();
type Mode = 'day' | 'week' | 'month';
const mode = ref<Mode>('day');

const savingsBuffer = computed(() => data.settings?.monthly_savings_target ?? 0);

// Simulação de margem (só na versão detalhada). null = usa o valor salvo.
const simBuffer = ref<number | null>(null);
const effectiveBuffer = computed(() => simBuffer.value ?? savingsBuffer.value);

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
    { savingsBuffer: effectiveBuffer.value },
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

const isDetailed = computed(() => props.variant === 'detailed');

// === Loop diário: "já gastei hoje" =========================================
const spentToday = computed(() => getDiscretionarySpentOnDate(data.transactions));
const tetoHoje = computed(() => breakdown.value.dailyBudget);
const sobraHoje = computed(() => Math.max(0, breakdown.value.dailyBudget - spentToday.value));
const spentOver = computed(() => spentToday.value > breakdown.value.dailyBudget);
const spentProgress = computed(() => {
  const teto = breakdown.value.dailyBudget;
  if (teto <= 0) return spentToday.value > 0 ? 1 : 0;
  return Math.max(0, Math.min(1, spentToday.value / teto));
});

// === Simulador de margem (detailed) ========================================
const sliderMax = computed(() => Math.max(100, Math.ceil(breakdown.value.freeBalanceMonth)));
const isDirty = computed(
  () =>
    simBuffer.value !== null &&
    Math.round(simBuffer.value) !== Math.round(savingsBuffer.value),
);
async function saveSimBuffer() {
  if (simBuffer.value === null) return;
  try {
    await settingsStore.update({ monthly_savings_target: simBuffer.value });
    toast.success('Margem de poupança atualizada.');
    simBuffer.value = null; // volta a refletir o valor salvo
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar margem.');
  }
}

const tabs: { value: Mode; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
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
      <SegmentedControl v-model="mode" :options="tabs" size="sm" />
    </div>

    <!-- Valor gigante -->
    <div class="mt-5 flex items-baseline gap-2">
      <span class="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums">
        {{ formatCurrency(currentValue) }}
      </span>
    </div>

    <!-- Loop diário: já gastei hoje × teto (só no modo dia) -->
    <div v-if="mode === 'day'" class="mt-4">
      <div class="flex items-center justify-between text-xs">
        <span class="text-muted-foreground">Já gastei hoje</span>
        <span
          class="tabular-nums"
          :class="spentOver ? 'font-medium text-destructive' : 'text-foreground'"
        >
          {{ formatCurrency(spentToday) }}
        </span>
      </div>
      <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          class="h-full rounded-full transition-[width]"
          :class="spentOver ? 'bg-destructive' : 'bg-primary'"
          :style="{ width: `${spentProgress * 100}%` }"
        />
      </div>
      <p class="mt-1 text-[11px] text-muted-foreground">
        <template v-if="spentOver">
          Estourou o teto de hoje em
          <span class="font-medium text-destructive tabular-nums">
            {{ formatCurrency(spentToday - tetoHoje) }}</span
          >.
        </template>
        <template v-else>
          Sobram
          <span class="font-medium text-foreground tabular-nums">{{ formatCurrency(sobraHoje) }}</span>
          pra hoje.
        </template>
      </p>
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

    <!-- Destaque de poupança (só na versão detalhada) -->
    <div
      v-if="isDetailed && breakdown.savingsApplied > 0 && !breakdown.savingsShortfall"
      class="mt-3 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3"
    >
      <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
        <PiggyBank class="size-4" />
      </span>
      <div>
        <p class="text-[10px] uppercase tracking-[0.16em] text-success/80 font-medium">
          Vai poupar este mês
        </p>
        <p class="text-lg font-semibold tabular-nums text-success">
          {{ formatCurrency(breakdown.savingsApplied) }}
        </p>
      </div>
    </div>
    <div
      v-else-if="isDetailed && breakdown.savingsTarget === 0"
      class="mt-3 flex items-start gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground"
    >
      <PiggyBank class="mt-0.5 size-4 shrink-0" />
      <p>
        Sem margem de poupança definida. Configure em
        <strong class="text-foreground">Ajustes</strong> para garantir uma sobra
        todo mês.
      </p>
    </div>

    <!-- Decomposição rápida. "Saldo hoje" só no detalhado (no Dashboard já há o KPI Saldo). -->
    <div
      class="mt-6 grid gap-3 border-t border-border/60 pt-4 text-xs"
      :class="isDetailed ? 'grid-cols-3' : 'grid-cols-2'"
    >
      <div v-if="isDetailed">
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

    <!-- Link para a decomposição (só no Dashboard; no Planejamento ela já está ao lado) -->
    <RouterLink
      v-if="!isDetailed"
      :to="{ name: 'planning' }"
      class="mt-2 inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
    >
      Ver de onde vem esse número
      <ArrowRight class="size-3" />
    </RouterLink>

    <!-- Simulador de margem de poupança (só no detalhado / Planejamento) -->
    <div v-if="isDetailed" class="mt-4 border-t border-border/60 pt-4">
      <div class="flex items-center justify-between gap-2">
        <p
          class="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          <PiggyBank class="size-3 text-primary" />
          Simular margem
        </p>
        <span class="text-xs tabular-nums text-muted-foreground">
          {{ formatCurrency(effectiveBuffer) }}/mês
        </span>
      </div>
      <input
        type="range"
        min="0"
        :max="sliderMax"
        step="50"
        :value="effectiveBuffer"
        class="mt-2 w-full accent-[oklch(var(--primary))]"
        aria-label="Margem de poupança mensal"
        @input="simBuffer = Number(($event.target as HTMLInputElement).value)"
      />
      <div class="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span class="flex-1">
          Guardando isso, dá pra gastar
          <span class="font-medium text-foreground tabular-nums">{{ formatCurrency(breakdown.dailyBudget) }}</span>/dia.
        </span>
        <Button
          v-if="isDirty"
          size="sm"
          class="shrink-0"
          :loading="settingsStore.saving"
          @click="saveSimBuffer"
        >
          Salvar
        </Button>
      </div>
    </div>

    <!-- Slot opcional (Dashboard mescla os Insights aqui pra aproveitar o espaço) -->
    <div v-if="$slots.extra" class="mt-4 border-t border-border/60 pt-4">
      <slot name="extra" />
    </div>
  </Card>
</template>
