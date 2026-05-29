<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import { useDataStore } from '@/stores/data';
import { dayjs } from '@/lib/helpers/date';
import { formatCurrency } from '@/lib/helpers/format';

const props = withDefaults(defineProps<{ month?: string }>(), {
  month: () => dayjs().format('YYYY-MM'),
});

const data = useDataStore();

interface Slice {
  name: string;
  value: number;
  color: string;
}

const slices = computed<Slice[]>(() => {
  const byCat = new Map<string, number>();
  for (const tx of data.transactions) {
    if (tx.type !== 'expense') continue;
    if (!tx.date.startsWith(props.month)) continue;
    const key = tx.category_id ?? '__none';
    byCat.set(key, (byCat.get(key) ?? 0) + Number(tx.amount));
  }
  const list: Slice[] = [];
  for (const [catId, value] of byCat) {
    const c = data.categories.find((x) => x.id === catId);
    list.push({
      name: c?.name ?? 'Sem categoria',
      value,
      color: c?.color ?? '#71717A',
    });
  }
  return list.sort((a, b) => b.value - a.value);
});

const total = computed(() => slices.value.reduce((s, x) => s + x.value, 0));

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: unknown) => {
      const p = params as { name: string; value: number; percent: number };
      return `<b>${p.name}</b><br/>${formatCurrency(p.value)} (${p.percent.toFixed(1)}%)`;
    },
    backgroundColor: 'oklch(0.185 0 0)',
    borderColor: 'oklch(0.255 0 0)',
    textStyle: { color: 'oklch(0.985 0 0)' },
  },
  legend: { show: false },
  series: [
    {
      type: 'pie',
      radius: ['62%', '88%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: 'oklch(0.185 0 0)', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      data: slices.value.map((s) => ({
        name: s.name,
        value: s.value,
        itemStyle: { color: s.color },
      })),
    },
  ],
}));
</script>

<template>
  <div v-if="slices.length === 0" class="flex h-64 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
    Nenhuma despesa neste mês ainda.
  </div>
  <div v-else class="relative grid grid-cols-1 items-center gap-4 md:grid-cols-2">
    <div class="relative h-64">
      <VChart class="h-full w-full" :option="option" autoresize />
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-[10px] uppercase tracking-wider text-muted-foreground">total</span>
        <span class="tabular-nums text-lg font-semibold">{{ formatCurrency(total) }}</span>
      </div>
    </div>
    <ul class="space-y-1.5 text-sm">
      <li v-for="s in slices.slice(0, 6)" :key="s.name" class="flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-2">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: s.color }" />
          <span class="truncate">{{ s.name }}</span>
        </span>
        <span class="tabular-nums text-xs text-muted-foreground">{{ formatCurrency(s.value) }}</span>
      </li>
      <li v-if="slices.length > 6" class="text-xs text-muted-foreground">
        + {{ slices.length - 6 }} categorias
      </li>
    </ul>
  </div>
</template>
