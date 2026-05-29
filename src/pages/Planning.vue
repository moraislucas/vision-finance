<script setup lang="ts">
/**
 * Planejamento:
 *  - Pode Gastar + decomposição da fórmula (mês corrente).
 *  - Projeção 3/6/12 meses com ECharts (negativos em vermelho + alerta).
 *  - Visão mensal HÍBRIDA: Calendário (grid com eventos + saldo por dia) ou
 *    Planilha (tabela vertical Dia/Diário/Saldo). Tab compartilha o mês.
 */
import { computed, ref } from 'vue';
import { AlertTriangle } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getBudgetBreakdown,
  getProjection,
  resolvePaymentCategoryId,
  type ProjectionPoint,
} from '@/lib/finance';
import { formatCurrency } from '@/lib/helpers/format';
import { dayjs } from '@/lib/helpers/date';

import Card from '@/components/ui/Card.vue';
import Switch from '@/components/ui/Switch.vue';
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
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
];

function monthLabel(ym: string): string {
  return dayjs(`${ym}-01`).format('MMMM');
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <p
        class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
      >
        Visão futura
      </p>
      <h1 class="text-2xl md:text-3xl font-semibold tracking-tight">Planejamento</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Veja quanto pode gastar agora, como será nos próximos meses e o saldo dia a dia.
      </p>
    </header>

    <!-- Pode Gastar + decomposição -->
    <div class="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <PodeGastarCard />
      <Card padded>
        <div class="mb-3">
          <p
            class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          >
            De onde vem este número
          </p>
          <p class="text-sm text-muted-foreground">
            Saldo livre = (saldo atual − reservado) + receitas previstas − contas a vencer
            − meta do mês.
          </p>
        </div>
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="r in rows"
              :key="r.label"
              class="border-b border-border last:border-0"
            >
              <td class="py-2.5 text-muted-foreground">{{ r.label }}</td>
              <td class="w-4 text-center text-muted-foreground">{{ r.sign }}</td>
              <td class="py-2.5 text-right tabular-nums">
                {{ formatCurrency(r.value) }}
              </td>
            </tr>
            <tr class="border-t border-border">
              <td class="py-2.5 font-medium">Sobra do mês</td>
              <td></td>
              <td class="py-2.5 text-right tabular-nums font-semibold">
                {{ formatCurrency(breakdown.freeBalanceMonth) }}
              </td>
            </tr>
            <tr>
              <td class="py-1 text-xs text-muted-foreground">
                ÷ {{ breakdown.daysRemaining }} dias restantes
              </td>
              <td></td>
              <td class="py-1 text-right tabular-nums text-xs text-muted-foreground">
                = {{ formatCurrency(breakdown.dailyBudget) }}/dia
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>

    <!-- Projeção 3/6/12 -->
    <Card padded>
      <header class="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          >
            Projeção
          </p>
          <p class="text-sm text-muted-foreground">
            Saldo simulado mês a mês para você ver o impacto das suas decisões.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="inline-flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60"
          >
            <button
              v-for="opt in horizonOptions"
              :key="opt.value"
              type="button"
              :class="[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                horizon === opt.value
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="horizon = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <label
            class="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
          >
            <Switch v-model="includeAvgVar" size="sm" />
            <span>incluir gasto médio</span>
          </label>
        </div>
      </header>

      <div
        v-if="firstNegative"
        class="mb-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <AlertTriangle class="mt-0.5 size-4 shrink-0" />
        <p>
          Atenção: saldo previsto negativo em
          <strong class="capitalize">{{ monthLabel(firstNegative.month) }}</strong>
          ({{ formatCurrency(firstNegative.balance) }}).
        </p>
      </div>

      <LinhaProjecao :points="projection" />
    </Card>

    <!-- Visão mensal híbrida: Calendário | Planilha -->
    <MonthlyView />
  </section>
</template>
