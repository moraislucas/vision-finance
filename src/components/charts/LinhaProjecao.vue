<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import type { ProjectionPoint } from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { dayjs } from '@/lib/helpers/date';

// Tokens (OKLCH) usados no chart — espelho parcial de src/style.css.
const C = {
  card: 'oklch(0.185 0 0)',
  border: 'oklch(0.255 0 0)',
  foreground: 'oklch(0.985 0 0)',
  mutedForeground: 'oklch(0.66 0.005 270)',
  primary: 'oklch(0.66 0.21 253)',
  destructive: 'oklch(0.65 0.22 25)',
  success: 'oklch(0.78 0.18 145)',
};

const props = defineProps<{ points: ProjectionPoint[] }>();

const labels = computed(() =>
  props.points.map((p) => dayjs(`${p.month}-01`).format('MMM/YY')),
);
const values = computed(() => props.points.map((p) => p.balance));
const hasNegative = computed(() => props.points.some((p) => p.balance < 0));

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: unknown) => {
      const arr = Array.isArray(params) ? params : [params];
      const p = arr[0] as { axisValueLabel?: string; name?: string; data?: number } | undefined;
      if (!p || typeof p.data !== 'number') return '';
      const color = p.data < 0 ? C.destructive : C.success;
      const label = p.axisValueLabel ?? p.name ?? '';
      return `<b>${label}</b><br/><span style="color:${color}">${formatCurrency(p.data)}</span>`;
    },
    backgroundColor: C.card,
    borderColor: C.border,
    textStyle: { color: C.foreground },
  },
  grid: { left: 50, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    data: labels.value,
    axisLine: { lineStyle: { color: C.border } },
    axisLabel: { color: C.mutedForeground, fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
    axisLabel: {
      color: C.mutedForeground,
      fontSize: 11,
      formatter: (v: number) =>
        Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
    },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: C.primary },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'oklch(0.66 0.21 253 / 0.35)' },
            { offset: 1, color: 'oklch(0.66 0.21 253 / 0.02)' },
          ],
        },
      },
      itemStyle: {
        color: (p) => {
          const d = (p as { data: number }).data;
          return d < 0 ? C.destructive : C.primary;
        },
      },
      markLine: hasNegative.value
        ? {
            symbol: 'none',
            label: { show: false },
            lineStyle: { color: 'oklch(0.32 0 0)', type: 'dashed' },
            data: [{ yAxis: 0 }],
          }
        : undefined,
      data: values.value,
    },
  ],
}));
</script>

<template>
  <VChart
    class="h-72 w-full"
    :option="option"
    :update-options="{ notMerge: true }"
    autoresize
  />
</template>
