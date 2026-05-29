<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { getFinancialScore, resolvePaymentCategoryId } from '@/lib/finance';
import Card from '@/components/ui/Card.vue';
import GaugeScore from '@/components/charts/GaugeScore.vue';

const data = useDataStore();

const score = computed(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getFinancialScore(
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
  );
});

const rows = computed(() => [
  { label: 'Reserva de emergência', pts: score.value.breakdown.emergencyReserve },
  { label: 'Gasta menos do que ganha', pts: score.value.breakdown.spendsLessThanEarns },
  { label: 'Cumpre metas no ritmo', pts: score.value.breakdown.goalsOnTrack },
  { label: 'Baixo uso de cartão', pts: score.value.breakdown.lowCardUsage },
  { label: 'Projeção positiva (3m)', pts: score.value.breakdown.projectionPositive },
]);
</script>

<template>
  <Card padded>
    <header class="mb-2">
      <div class="text-xs uppercase tracking-wider text-muted-foreground">Score Financeiro</div>
      <div class="text-sm text-muted-foreground">0–100 · 5 critérios</div>
    </header>
    <GaugeScore :score="score" />
    <ul class="mt-3 space-y-1.5 text-xs">
      <li v-for="r in rows" :key="r.label" class="flex items-center justify-between">
        <span class="text-muted-foreground">{{ r.label }}</span>
        <span class="tabular-nums">{{ r.pts.toFixed(1) }}/20</span>
      </li>
    </ul>
  </Card>
</template>
