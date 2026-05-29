<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle, Sparkles, Info } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { getInsights, resolvePaymentCategoryId } from '@/lib/finance';
import Card from '@/components/ui/Card.vue';

const data = useDataStore();

const insights = computed(() => {
  const paymentCategoryId = resolvePaymentCategoryId(data.categories);
  return getInsights(
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

const styleFor = (s: string) =>
  s === 'warning'
    ? { cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: AlertTriangle }
    : s === 'positive'
      ? { cls: 'border-success/30 bg-success/10 text-success', icon: Sparkles }
      : { cls: 'border-border bg-secondary/30 text-foreground', icon: Info };
</script>

<template>
  <Card padded>
    <header class="mb-3">
      <div class="text-xs uppercase tracking-wider text-muted-foreground">Insights</div>
      <div class="text-sm text-muted-foreground">Gerados a partir dos seus dados.</div>
    </header>
    <ul v-if="insights.length" class="space-y-2">
      <li
        v-for="i in insights"
        :key="i.id"
        :class="['flex items-start gap-2 rounded-md border p-3 text-sm', styleFor(i.severity).cls]"
      >
        <component :is="styleFor(i.severity).icon" class="mt-0.5 h-4 w-4 shrink-0" />
        <span>{{ i.message }}</span>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">
      Por enquanto, nada para destacar. Continue lançando transações.
    </p>
  </Card>
</template>
