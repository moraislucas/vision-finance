/**
 * Setup central do ECharts — registra apenas os módulos que usamos para
 * manter o bundle enxuto. Importe `vue-echarts` direto onde precisar; este
 * módulo só precisa ser carregado uma vez (faça `import '@/lib/echarts'` no
 * main.ts).
 */
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart, BarChart, GaugeChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components';

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  GaugeChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
]);
