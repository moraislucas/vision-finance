<script setup lang="ts">
/**
 * Dashboard — ESTILO.MD §12 (composição de página).
 *
 * Layout em 4 blocos:
 *  1. Topo: 4 MetricCards (B0 / Disponível / Projetado / Reservado).
 *  2. Hero: Pode Gastar (2/3) + Score (1/3) — alturas casadas via h-full.
 *  3. Meio: Economia + Próximas contas + Donut categorias (3 colunas em lg).
 *  4. Base: Últimas transações + Insights (2 colunas em lg).
 *
 * Tudo deriva de getters da engine — esta página não recalcula nada (princípio 4).
 */
import { computed, ref } from 'vue';
import { Wallet, TrendingUp, ChartLine, PiggyBank } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getCurrentBalance,
  getAvailableNow,
  getProjectedMonthEndBalance,
  getReserved,
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
import InsightsCard from '@/components/dashboard/InsightsCard.vue';
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
const projected = computed(() =>
  getProjectedMonthEndBalance(
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
    resolvePaymentCategoryId(data.categories),
  ),
);
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

    <!-- 1. 4 MetricCards -->
    <section class="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <KpiCard label="Saldo Atual" :value="B0" :icon="Wallet" />
      <KpiCard
        label="Disponível agora"
        :value="available"
        :icon="TrendingUp"
        hint="B0 menos o reservado"
      />
      <KpiCard
        label="Projetado fim do mês"
        :value="projected"
        :icon="ChartLine"
        :tone="projected < 0 ? 'negative' : 'positive'"
      />
      <KpiCard
        label="Reservado"
        :value="reserved"
        :icon="PiggyBank"
        tone="muted"
        hint="Earmark das metas ativas"
      />
    </section>

    <!-- 2. Hero: Pode Gastar (2/3) + Score (1/3). items-stretch casa as alturas. -->
    <section class="mt-3 grid gap-3 md:gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <PodeGastarCard />
      </div>
      <ScoreCard />
    </section>

    <!-- 3. Meio: Economia + Próximas contas + Donut -->
    <section class="mt-3 grid gap-3 md:gap-4 lg:grid-cols-3">
      <EconomiaCard />
      <ProximasContasCard />
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

    <!-- 4. Base: Últimas transações + Insights -->
    <section class="mt-3 grid gap-3 md:gap-4 lg:grid-cols-2">
      <UltimasTransacoesCard />
      <InsightsCard />
    </section>

    <FloatingAddButton class="md:hidden" @click="sheetOpen = true" />

    <Sheet :open="sheetOpen" title="Nova transação" @update:open="sheetOpen = $event">
      <TransactionForm @saved="sheetOpen = false" @cancel="sheetOpen = false" />
    </Sheet>
  </section>
</template>
