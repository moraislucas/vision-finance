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

/**
 * `embedded` renderiza só o conteúdo (sem wrapper Card), para ser mesclado
 * dentro de outro card — ex.: o "Pode Gastar" no Dashboard.
 */
withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

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
  <component :is="embedded ? 'div' : Card" :padded="embedded ? undefined : true">
    <div class="flex items-center gap-2">
      <PiggyBank class="size-3 text-primary" />
      <span
        class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
      >
        Economia do mês
      </span>
      <span class="ml-auto text-xs tabular-nums text-muted-foreground">
        {{ formatCurrency(summary.saved) }} de {{ formatCurrency(summary.target) }}
      </span>
    </div>

    <div class="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
      <div
        class="h-full bg-primary transition-[width]"
        :style="{ width: `${Math.max(2, summary.ratio * 100)}%` }"
      />
    </div>
    <div class="mt-1.5 text-right text-[11px] text-muted-foreground">
      {{ formatPercent(summary.ratio) }} da meta mensal
    </div>
  </component>
</template>
