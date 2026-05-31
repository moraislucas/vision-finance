<script setup lang="ts">
/**
 * Planejamento — versão mobile-otimizada.
 *
 * Mobile: tudo em coluna única, decomposição é Collapsible (recolhe por padrão
 * pra não empilhar 200px de tabela acima do que importa), Projeção com altura
 * menor e toggle quebra em duas linhas se necessário.
 */
import { computed, ref } from 'vue';
import { AlertTriangle, ChevronDown } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getBudgetBreakdown,
  getProjection,
  getCurrentBalance,
  resolvePaymentCategoryId,
  type ProjectionPoint,
} from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { dayjs } from '@/lib/helpers/date';

import Card from '@/components/ui/Card.vue';
import Switch from '@/components/ui/Switch.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PodeGastarCard from '@/components/dashboard/PodeGastarCard.vue';
import LinhaProjecao from '@/components/charts/LinhaProjecao.vue';
import MonthlyView from '@/components/planning/MonthlyView.vue';

const data = useDataStore();

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

type Horizon = 3 | 6 | 12;
const horizon = ref<Horizon>(6);
const includeAvgVar = ref(true);
const breakdownOpen = ref(false); // recolhido por padrão no mobile

const projection = computed<ProjectionPoint[]>(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getProjection(
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
    horizon.value,
    paymentCategoryId,
    undefined,
    { includeAvgVar: includeAvgVar.value, avgVarWindowMonths: 3 },
  );
});

const firstNegative = computed(() =>
  projection.value.slice(1).find((p) => p.balance < 0),
);

// Âncora "Hoje" = saldo real atual, à frente da projeção mês-a-mês.
// Assim o ponto mais à esquerda do gráfico bate com o saldo do Dashboard, e os
// pontos seguintes ficam claramente rotulados como fim de cada mês.
const chartPoints = computed<(ProjectionPoint & { label?: string })[]>(() => {
  const b0 = getCurrentBalance(data.accounts, data.transactions);
  return [
    {
      month: dayjs().format('YYYY-MM'),
      balance: b0,
      negative: b0 < 0,
      label: 'Hoje',
    },
    ...projection.value,
  ];
});

const rows = computed(() => {
  const base = [
    { label: 'Saldo Atual', value: breakdown.value.B0, sign: '+' },
    { label: 'Receitas que ainda vão entrar', value: breakdown.value.Ir, sign: '+' },
    { label: 'Contas a vencer', value: breakdown.value.Or, sign: '−' },
    { label: 'Faltando guardar este mês', value: breakdown.value.Cr, sign: '−' },
    { label: 'Já reservado em metas', value: breakdown.value.R, sign: '−' },
  ];
  if (breakdown.value.savingsApplied > 0) {
    base.push({
      label: 'Margem de poupança automática',
      value: breakdown.value.savingsApplied,
      sign: '−',
    });
  }
  return base;
});

const horizonOptions: { value: Horizon; label: string }[] = [
  { value: 3, label: '3m' },
  { value: 6, label: '6m' },
  { value: 12, label: '12m' },
];

function monthLabel(ym: string): string {
  return dayjs(`${ym}-01`).format('MMMM');
}
</script>

<template>
  <section class="space-y-4 md:space-y-6">
    <PageHeader
      eyebrow="Visão futura"
      title="Planejamento"
      description="Pode gastar hoje, projeção mês a mês e saldo dia a dia."
    />

    <!-- Pode Gastar + Decomposição (no mobile: PodeGastar em destaque,
         decomposição colapsada num details/summary; no desktop: grid 2 cols) -->
    <div class="grid gap-3 md:gap-4 lg:grid-cols-2 lg:items-stretch">
      <PodeGastarCard variant="detailed" />

      <Card padded>
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 text-left lg:cursor-default"
          :aria-expanded="breakdownOpen"
          @click="breakdownOpen = !breakdownOpen"
        >
          <div>
            <p
              class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
            >
              De onde vem este número
            </p>
            <p class="text-sm text-muted-foreground">
              Toque para ver a conta detalhada.
            </p>
          </div>
          <ChevronDown
            class="size-4 shrink-0 text-muted-foreground transition-transform lg:hidden"
            :class="breakdownOpen ? 'rotate-180' : ''"
          />
        </button>

        <table
          class="mt-3 w-full text-sm"
          :class="breakdownOpen ? 'block' : 'hidden lg:table'"
        >
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.label"
              class="border-b border-border last:border-0"
            >
              <td class="py-2 text-xs md:text-sm text-muted-foreground">
                {{ r.label }}
              </td>
              <td class="w-4 text-center text-muted-foreground">{{ r.sign }}</td>
              <td class="py-2 text-right tabular-nums text-xs md:text-sm">
                {{ formatCurrency(r.value) }}
              </td>
            </tr>
            <tr class="border-t border-border">
              <td class="py-2 text-sm font-medium">Sobra do mês</td>
              <td></td>
              <td class="py-2 text-right tabular-nums text-sm font-semibold">
                {{ formatCurrency(breakdown.freeBalanceMonth) }}
              </td>
            </tr>
            <tr>
              <td class="py-1 text-[11px] text-muted-foreground">
                ÷ {{ breakdown.daysRemaining }} dias restantes
              </td>
              <td></td>
              <td class="py-1 text-right tabular-nums text-[11px] text-muted-foreground">
                = {{ formatCurrency(breakdown.dailyBudget) }}/dia
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>

    <!-- Projeção 3/6/12 -->
    <Card padded>
      <header
        class="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3"
      >
        <div>
          <p
            class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          >
            Projeção
          </p>
          <p class="text-xs md:text-sm text-muted-foreground">
            Saldo simulado mês a mês.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <SegmentedControl v-model="horizon" :options="horizonOptions" size="sm" />
          <label
            class="inline-flex items-center gap-2 text-[11px] text-muted-foreground select-none"
          >
            <Switch v-model="includeAvgVar" size="sm" />
            <span>com gasto médio</span>
          </label>
        </div>
      </header>

      <div
        v-if="firstNegative"
        class="mb-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs md:text-sm text-destructive"
      >
        <AlertTriangle class="mt-0.5 size-4 shrink-0" />
        <p>
          Saldo previsto negativo em
          <strong class="capitalize">{{ monthLabel(firstNegative.month) }}</strong>
          ({{ formatCurrency(firstNegative.balance) }}).
        </p>
      </div>

      <LinhaProjecao :points="chartPoints" />
    </Card>

    <!-- Visão mensal híbrida: Calendário | Planilha -->
    <MonthlyView />
  </section>
</template>
