<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import type { FinancialScore } from '@/lib/finance';

const props = defineProps<{ score: FinancialScore }>();

const bandColor = computed(() => {
  switch (props.score.band) {
    case 'excellent':
      return '#22C55E';
    case 'good':
      return '#0A84FF';
    case 'attention':
      return '#F59E0B';
    case 'critical':
      return '#EF4444';
  }
});

const bandLabel = computed(() => {
  switch (props.score.band) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bom';
    case 'attention':
      return 'Atenção';
    case 'critical':
      return 'Crítico';
  }
});

const option = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      progress: { show: true, width: 14, itemStyle: { color: bandColor.value } },
      axisLine: { lineStyle: { width: 14, color: [[1, 'oklch(0.255 0 0)']] } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '5%'],
        fontSize: 36,
        fontWeight: 700,
        formatter: '{value}',
        color: 'oklch(0.985 0 0)',
      },
      data: [{ value: props.score.total }],
    },
  ],
}));
</script>

<template>
  <div class="relative">
    <VChart class="h-40 w-full" :option="option" autoresize />
    <p class="text-center text-sm font-semibold" :style="{ color: bandColor }">{{ bandLabel }}</p>
  </div>
</template>
