<script setup lang="ts">
/**
 * Dashboard — ESTILO.MD §12 (composição de página).
 *
 * Layout em 3 blocos:
 *  1. Topo: 4 MetricCards (B0 / Disponível / Projetado / Reservado).
 *  2. Hero: Pode Gastar (2/3, com Economia do mês + Insights embutidos) +
 *     Distribuição dos gastos (1/3).
 *  3. Base: Últimas transações + Próximas contas + Score (3 colunas em lg).
 *
 * Tudo deriva de getters da engine — esta página não recalcula nada (princípio 4).
 */
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Wallet,
  TrendingUp,
  ChartLine,
  PiggyBank,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
} from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getCurrentBalance,
  getAvailableNow,
  getProjectedMonthEndBalance,
  getReserved,
  getInsights,
  getFinancialScore,
  resolvePaymentCategoryId,
} from '@/lib/finance';

import PageHeader from '@/components/ui/PageHeader.vue';
import Sheet from '@/components/ui/Sheet.vue';
import PodeGastarCard from '@/components/dashboard/PodeGastarCard.vue';
import KpiCard from '@/components/dashboard/KpiCard.vue';
import EconomiaCard from '@/components/dashboard/EconomiaCard.vue';
import ProximasContasCard from '@/components/dashboard/ProximasContasCard.vue';
import UltimasTransacoesCard from '@/components/dashboard/UltimasTransacoesCard.vue';
import ScoreCard from '@/components/dashboard/ScoreCard.vue';
import DonutCategorias from '@/components/charts/DonutCategorias.vue';
import FloatingAddButton from '@/components/layout/FloatingAddButton.vue';
import TransactionForm from '@/components/transactions/TransactionForm.vue';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

const data = useDataStore();
const sheetOpen = ref(false);

const B0 = computed(() => getCurrentBalance(data.accounts, data.transactions));
const available = computed(() =>
  getAvailableNow(data.accounts, data.transactions, data.goals),
);
const reserved = computed(() => getReserved(data.goals));

const engineData = computed(() => ({
  accounts: data.accounts,
  transactions: data.transactions,
  recurringIncomes: data.recurringIncomes,
  recurringExpenses: data.recurringExpenses,
  goals: data.goals,
  goalContributions: data.goalContributions,
  creditCards: data.creditCards,
  creditCardPurchases: data.creditCardPurchases,
  categories: data.categories,
}));

// Insights (mesclados no card Pode Gastar). Mostra os 3 mais relevantes.
const insights = computed(() =>
  getInsights(engineData.value, resolvePaymentCategoryId(data.categories)).slice(0, 3),
);

const insightStyle = (s: string) =>
  s === 'warning'
    ? { cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: AlertTriangle }
    : s === 'positive'
      ? { cls: 'border-success/30 bg-success/10 text-success', icon: Sparkles }
      : { cls: 'border-border bg-secondary/30 text-foreground', icon: Info };
const projected = computed(() =>
  getProjectedMonthEndBalance(engineData.value, resolvePaymentCategoryId(data.categories)),
);

// Herói: status financeiro (semáforo) derivado do Score 0–100.
const score = computed(() =>
  getFinancialScore(engineData.value, resolvePaymentCategoryId(data.categories)),
);
const status = computed(() => {
  const t = score.value.total;
  if (t >= 70)
    return {
      label: 'Dentro do plano',
      icon: ShieldCheck,
      box: 'border-success/30 bg-success/10',
      iconWrap: 'bg-success/15 text-success',
      num: 'text-success',
    };
  if (t >= 40)
    return {
      label: 'Atenção',
      icon: AlertTriangle,
      box: 'border-warning/30 bg-warning/10',
      iconWrap: 'bg-warning/15 text-warning',
      num: 'text-warning',
    };
  return {
    label: 'Risco',
    icon: AlertCircle,
    box: 'border-destructive/30 bg-destructive/10',
    iconWrap: 'bg-destructive/15 text-destructive',
    num: 'text-destructive',
  };
});
</script>

<template>
  <section>
    <PageHeader eyebrow="Visão geral" title="Dashboard">
      <template #actions>
        <Button class="hidden md:inline-flex" @click="sheetOpen = true">
          + Nova transação
        </Button>
      </template>
    </PageHeader>

    <!-- 0. Herói: status financeiro num relance -->
    <RouterLink
      :to="{ name: 'planning' }"
      :class="['mb-3 md:mb-4 flex items-center gap-3 rounded-2xl border p-3 md:p-4 transition-colors', status.box]"
    >
      <span :class="['grid size-9 shrink-0 place-items-center rounded-xl', status.iconWrap]">
        <component :is="status.icon" class="size-5" />
      </span>
      <div class="min-w-0">
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">
          Status financeiro
        </p>
        <p class="text-base font-semibold leading-tight">{{ status.label }}</p>
      </div>
      <div class="ml-auto text-right leading-none">
        <span :class="['block text-2xl font-semibold tabular-nums', status.num]">
          {{ score.total }}
        </span>
        <span class="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          de 100
        </span>
      </div>
    </RouterLink>

    <!-- 1. 4 MetricCards (2x2 no mobile, 4 col no lg) -->
    <section class="grid grid-cols-2 gap-2.5 md:gap-4 lg:grid-cols-4">
      <KpiCard label="Saldo" :value="B0" :icon="Wallet" />
      <KpiCard
        label="Disponível"
        :value="available"
        :icon="TrendingUp"
        hint="Saldo menos o reservado em metas"
      />
      <KpiCard
        label="Fim do mês"
        :value="projected"
        :icon="ChartLine"
        :tone="projected < 0 ? 'negative' : 'positive'"
      />
      <KpiCard
        label="Reservado"
        :value="reserved"
        :icon="PiggyBank"
        tone="muted"
        hint="Guardado em metas/cofrinhos"
      />
    </section>

    <!-- 2. Hero: Pode Gastar (2/3, com Economia + Insights) + Score (1/3). -->
    <section class="mt-3 md:mt-4 grid gap-3 md:gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <PodeGastarCard>
          <template #extra>
            <EconomiaCard embedded />
            <template v-if="insights.length">
              <p class="mb-2 mt-4 border-t border-border/60 pt-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">
                Insights
              </p>
              <ul class="space-y-1.5">
                <li
                  v-for="i in insights"
                  :key="i.id"
                  :class="['flex items-start gap-2 rounded-xl border p-2.5 text-xs', insightStyle(i.severity).cls]"
                >
                  <component :is="insightStyle(i.severity).icon" class="mt-0.5 size-3.5 shrink-0" />
                  <span>{{ i.message }}</span>
                </li>
              </ul>
            </template>
          </template>
        </PodeGastarCard>
      </div>
      <Card padded class="flex flex-col">
        <header class="mb-3">
          <p
            class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          >
            Distribuição dos gastos
          </p>
          <p class="text-sm text-muted-foreground">Por categoria, neste mês.</p>
        </header>
        <div class="flex-1">
          <DonutCategorias />
        </div>
      </Card>
    </section>

    <!-- 3. Últimas transações + Próximas contas + Score -->
    <section class="mt-3 md:mt-4 grid gap-3 md:gap-4 lg:grid-cols-3">
      <UltimasTransacoesCard />
      <ProximasContasCard />
      <ScoreCard />
    </section>

    <FloatingAddButton class="md:hidden" @click="sheetOpen = true" />

    <Sheet :open="sheetOpen" title="Nova transação" @update:open="sheetOpen = $event">
      <TransactionForm @saved="sheetOpen = false" @cancel="sheetOpen = false" />
    </Sheet>
  </section>
</template>
