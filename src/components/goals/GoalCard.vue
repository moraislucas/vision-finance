<script setup lang="ts">
import { computed } from 'vue';
import { ShieldCheck, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from '@lucide/vue';
import {
  getGoalDailyTarget,
  getGoalMonthlyTarget,
  getGoalProgress,
  getGoalWeeklyTarget,
  getContributedThisMonth,
} from '@/lib/finance';
import { formatCurrency, formatPercent } from '@/lib/helpers/format';
import { useDataStore } from '@/stores/data';
import type { Goal } from '@/types/domain';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';
import IconButton from '@/components/ui/IconButton.vue';

const props = defineProps<{ goal: Goal }>();
const emit = defineEmits<{
  edit: [];
  remove: [];
  deposit: [];
  withdraw: [];
}>();
const data = useDataStore();

const progress = computed(() => getGoalProgress(props.goal));
const monthlyTarget = computed(() => getGoalMonthlyTarget(props.goal));
const dailyTarget = computed(() => getGoalDailyTarget(props.goal));
const weeklyTarget = computed(() => getGoalWeeklyTarget(props.goal));
const contributed = computed(() =>
  getContributedThisMonth(props.goal, data.goalContributions),
);
</script>

<template>
  <Card padded class="space-y-4">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: goal.color ?? '#0A84FF' }"
          />
          <h3 class="truncate text-base font-semibold">{{ goal.name }}</h3>
          <Badge v-if="goal.is_emergency" variant="warning">
            <ShieldCheck class="size-3" /> Emergência
          </Badge>
        </div>
        <p v-if="goal.target_date" class="mt-0.5 text-xs text-muted-foreground">
          Prazo: {{ goal.target_date }}
        </p>
        <p v-else class="mt-0.5 text-xs text-muted-foreground">
          Contribuição mensal fixa
        </p>
      </div>
      <div class="flex shrink-0 gap-1">
        <IconButton label="Editar meta" @click="emit('edit')">
          <Pencil />
        </IconButton>
        <IconButton label="Excluir meta" variant="danger" @click="emit('remove')">
          <Trash2 />
        </IconButton>
      </div>
    </header>

    <div>
      <div class="flex items-baseline justify-between text-sm">
        <span class="tabular-nums text-lg font-semibold">
          {{ formatCurrency(Number(goal.current_amount)) }}
        </span>
        <span class="text-xs text-muted-foreground">
          de {{ formatCurrency(Number(goal.target_amount)) }}
        </span>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          class="h-full bg-primary transition-[width]"
          :style="{ width: `${Math.min(100, Math.max(2, progress * 100))}%` }"
        />
      </div>
      <p class="mt-1 text-right text-xs text-muted-foreground">
        {{ formatPercent(Math.min(1, progress)) }}
      </p>
    </div>

    <div
      class="grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-xs"
    >
      <div>
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Por dia
        </div>
        <div class="mt-0.5 tabular-nums text-sm">{{ formatCurrency(dailyTarget) }}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Por semana
        </div>
        <div class="mt-0.5 tabular-nums text-sm">{{ formatCurrency(weeklyTarget) }}</div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Por mês
        </div>
        <div class="mt-0.5 tabular-nums text-sm">{{ formatCurrency(monthlyTarget) }}</div>
      </div>
    </div>

    <p class="text-xs text-muted-foreground">
      Este mês:
      <span class="tabular-nums text-foreground">
        {{ formatCurrency(contributed) }}
      </span>
      de
      <span class="tabular-nums text-foreground">
        {{ formatCurrency(monthlyTarget) }}
      </span>
      .
    </p>

    <div class="flex gap-2">
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        @click="emit('deposit')"
      >
        <ArrowDownToLine class="size-4" />
        Guardar
      </button>
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/60 active:scale-[0.98] transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        @click="emit('withdraw')"
      >
        <ArrowUpFromLine class="size-4" />
        Resgatar
      </button>
    </div>
  </Card>
</template>
