<script setup lang="ts">
/**
 * Próximas contas (mês corrente): recorrentes não realizadas + faturas a vencer.
 * Mostra valor, dias para o vencimento e badge da categoria quando houver.
 */
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import {
  isRecurringExpenseRealized,
  getCardInvoice,
} from '@/lib/finance';
import { dayjs, today } from '@/lib/helpers/date';
import { formatCurrency } from '@/lib/helpers/format';
import { CalendarClock } from '@lucide/vue';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';

const data = useDataStore();

interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  daysAhead: number;
  badge?: { name: string; color: string | null };
}

const items = computed<UpcomingItem[]>(() => {
  const ref = today();
  const todayDay = ref.date();
  const currentMonth = ref.month() + 1;
  const out: UpcomingItem[] = [];

  for (const re of data.recurringExpenses) {
    if (!re.active) continue;
    if (re.due_day < todayDay) continue;
    if (re.frequency === 'yearly' && re.due_month !== currentMonth) continue;
    if (isRecurringExpenseRealized(re, data.transactions, ref)) continue;
    const cat = re.category_id ? data.categories.find((c) => c.id === re.category_id) : undefined;
    out.push({
      id: `re-${re.id}`,
      name: re.name,
      amount: Number(re.amount),
      dueDay: re.due_day,
      daysAhead: re.due_day - todayDay,
      ...(cat ? { badge: { name: cat.name, color: cat.color } } : {}),
    });
  }

  for (const card of data.creditCards) {
    if (!card.active) continue;
    if (card.due_day < todayDay) continue;
    const invoice = getCardInvoice(card, data.creditCardPurchases, ref);
    if (invoice.total <= 0) continue;
    out.push({
      id: `card-${card.id}`,
      name: `Fatura ${card.name}`,
      amount: invoice.total,
      dueDay: card.due_day,
      daysAhead: card.due_day - todayDay,
      badge: { name: 'Cartão', color: card.color },
    });
  }

  return out.sort((a, b) => a.daysAhead - b.daysAhead).slice(0, 5);
});

function dueLabel(d: number): string {
  if (d === 0) return 'vence hoje';
  if (d === 1) return 'em 1 dia';
  return `em ${d} dias`;
}
function _unused() {
  void dayjs;
}
void _unused;
</script>

<template>
  <Card padded>
    <header class="mb-3 flex items-center justify-between">
      <div>
        <div class="text-xs uppercase tracking-wider text-muted-foreground">Próximas contas</div>
        <div class="mt-0.5 text-sm text-muted-foreground">{{ items.length }} a vencer neste mês</div>
      </div>
      <div class="rounded-full bg-warning/15 p-2 text-warning">
        <CalendarClock class="h-4 w-4" />
      </div>
    </header>

    <ul v-if="items.length" class="divide-y divide-border">
      <li v-for="it in items" :key="it.id" class="flex items-center justify-between gap-3 py-2.5">
        <div class="min-w-0 space-y-0.5">
          <div class="truncate text-sm font-medium">{{ it.name }}</div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge v-if="it.badge" :color="it.badge.color">{{ it.badge.name }}</Badge>
            <span>{{ dueLabel(it.daysAhead) }} · dia {{ it.dueDay }}</span>
          </div>
        </div>
        <span class="tabular-nums text-sm text-destructive">{{ formatCurrency(it.amount) }}</span>
      </li>
    </ul>
    <p v-else class="py-4 text-center text-sm text-muted-foreground">
      Nenhuma conta a vencer este mês 🎉
    </p>
  </Card>
</template>
