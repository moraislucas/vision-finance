<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import type { ProjectionPoint } from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { dayjs } from '@/lib/helpers/date';

// Cores do chart em HEX/RGBA — espelho dos tokens OKLCH de src/style.css.
// ⚠️ NÃO usar oklch() aqui: o zrender (motor do ECharts) faz parsing/
// interpolação própria das cores ao animar updates (ex.: trocar o filtro de
// horizonte) e NÃO entende oklch → quebra "ao manipular os filtros". O canvas
// renderiza oklch na 1ª pintura, por isso o bug só aparecia ao atualizar.
const C = {
  card: '#1c1c1e',
  border: '#2c2c2e',
  foreground: '#fafafa',
  mutedForeground: '#9a9aa2',
  primary: '#0a84ff',
  destructive: '#ff453a',
  success: '#30d158',
};

/** Aceita um `label` opcional por ponto (ex.: a âncora "Hoje"). */
const props = defineProps<{ points: (ProjectionPoint & { label?: string })[] }>();

const labels = computed(() =>
  props.points.map((p) => p.label ?? dayjs(`${p.month}-01`).format('MMM/YY')),
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
    // hideOverlap evita labels amontoados no mobile (até 13 pontos no view 12m).
    axisLabel: { color: C.mutedForeground, fontSize: 11, hideOverlap: true },
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
            { offset: 0, color: 'rgba(10,132,255,0.35)' },
            { offset: 1, color: 'rgba(10,132,255,0.02)' },
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
            lineStyle: { color: '#3a3a3c', type: 'dashed' },
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
