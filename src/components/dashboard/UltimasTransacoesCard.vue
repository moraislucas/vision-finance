<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { formatCurrency, formatDate } from '@/lib/helpers/format';
import { RouterLink } from 'vue-router';
import { ArrowRightLeft, ChevronRight } from '@lucide/vue';
import Badge from '@/components/ui/Badge.vue';
import Card from '@/components/ui/Card.vue';

const data = useDataStore();

const latest = computed(() =>
  [...data.transactions]
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
    .slice(0, 5),
);
</script>

<template>
  <Card padded>
    <header class="mb-3 flex items-center justify-between">
      <div>
        <div class="text-xs uppercase tracking-wider text-muted-foreground">Últimas transações</div>
        <div class="mt-0.5 text-sm text-muted-foreground">5 mais recentes</div>
      </div>
      <RouterLink
        :to="{ name: 'transactions' }"
        class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        ver todas <ChevronRight class="h-3 w-3" />
      </RouterLink>
    </header>

    <ul v-if="latest.length" class="divide-y divide-border">
      <li v-for="tx in latest" :key="tx.id" class="flex items-center justify-between gap-3 py-2.5">
        <div class="min-w-0">
          <div class="truncate text-sm font-medium">{{ tx.description }}</div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge
              v-if="data.categories.find((c) => c.id === tx.category_id)"
              :color="data.categories.find((c) => c.id === tx.category_id)?.color ?? null"
            >
              {{ data.categories.find((c) => c.id === tx.category_id)?.name }}
            </Badge>
            <span>{{ formatDate(tx.date) }}</span>
          </div>
        </div>
        <span
          :class="[
            'tabular-nums text-sm',
            tx.type === 'income' ? 'text-success' : 'text-destructive',
          ]"
        >
          {{ tx.type === 'income' ? '+' : '−' }} {{ formatCurrency(Number(tx.amount)) }}
        </span>
      </li>
    </ul>
    <div v-else class="flex flex-col items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <ArrowRightLeft class="h-5 w-5" />
      Nenhuma transação ainda.
    </div>
  </Card>
</template>
