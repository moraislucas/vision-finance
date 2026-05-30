<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { formatCurrency, formatDate } from '@/lib/helpers/format';
import { RouterLink } from 'vue-router';
import { ArrowRightLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from '@lucide/vue';
import Card from '@/components/ui/Card.vue';
import Tooltip from '@/components/ui/Tooltip.vue';

const data = useDataStore();

const categoryById = computed(
  () => new Map(data.categories.map((c) => [c.id, c])),
);

const catOf = (id: string | null | undefined) => categoryById.value.get(id ?? '');

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

    <ul v-if="latest.length" class="space-y-1">
      <li
        v-for="tx in latest"
        :key="tx.id"
        class="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-secondary/30"
      >
        <!-- Ícone de entrada/saída (discreto) -->
        <div
          :class="[
            'grid size-7 shrink-0 place-items-center rounded-full',
            tx.type === 'income'
              ? 'bg-success/10 text-success/80'
              : 'bg-destructive/10 text-destructive/80',
          ]"
        >
          <component
            :is="tx.type === 'income' ? ArrowUpRight : ArrowDownRight"
            class="size-3.5"
          />
        </div>

        <!-- Linha de cima: nome + categoria · Linha de baixo: data -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium">{{ tx.description }}</span>
            <Tooltip v-if="catOf(tx.category_id)" :text="catOf(tx.category_id)?.name ?? ''">
              <span
                class="grid size-6 shrink-0 place-items-center rounded-full text-xs leading-none"
                :style="{ backgroundColor: `${catOf(tx.category_id)?.color ?? '#71717A'}1A` }"
              >
                {{ catOf(tx.category_id)?.icon || '🏷️' }}
              </span>
            </Tooltip>
          </div>
          <div class="mt-0.5 text-xs text-muted-foreground">{{ formatDate(tx.date) }}</div>
        </div>

        <!-- Valor (centralizado nas duas linhas, à direita) -->
        <span
          :class="[
            'shrink-0 tabular-nums text-sm font-medium',
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
