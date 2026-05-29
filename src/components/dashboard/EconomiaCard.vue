<script setup lang="ts">
/**
 * Economia do mês — agregado de "quanto guardar / quanto já guardou" para
 * todas as metas ativas neste mês.
 */
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { getGoalMonthlyTarget, getContributedThisMonth } from '@/lib/finance';
import { formatCurrency, formatPercent } from '@/lib/helpers/format';
import Card from '@/components/ui/Card.vue';
import { PiggyBank } from '@lucide/vue';

const data = useDataStore();

const summary = computed(() => {
  let target = 0;
  let saved = 0;
  for (const g of data.goals) {
    if (!g.active) continue;
    target += getGoalMonthlyTarget(g);
    saved += Math.min(getGoalMonthlyTarget(g), getContributedThisMonth(g, data.goalContributions));
  }
  const ratio = target > 0 ? Math.min(1, saved / target) : 0;
  return { target, saved, ratio };
});
</script>

<template>
  <Card padded>
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-xs uppercase tracking-wider text-muted-foreground">Economia do mês</div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ formatCurrency(summary.saved) }} de {{ formatCurrency(summary.target) }}
        </div>
      </div>
      <div class="rounded-full bg-primary/15 p-2 text-primary">
        <PiggyBank class="h-4 w-4" />
      </div>
    </div>

    <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
      <div
        class="h-full bg-primary transition-[width]"
        :style="{ width: `${Math.max(2, summary.ratio * 100)}%` }"
      />
    </div>
    <div class="mt-2 text-right text-xs text-muted-foreground">
      {{ formatPercent(summary.ratio) }} da meta mensal
    </div>
  </Card>
</template>
