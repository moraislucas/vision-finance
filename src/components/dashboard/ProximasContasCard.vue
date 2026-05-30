<script setup lang="ts">
/**
 * Próximas contas (mês corrente): recorrentes não realizadas + faturas a vencer.
 * Cada linha: tile com o dia do vencimento + nome + categoria (com emoji) +
 * urgência + valor. Ordenado por proximidade do vencimento.
 */
import { computed } from 'vue';
import { useDataStore } from '@/stores/data';
import { isRecurringExpenseRealized, getCardInvoice } from '@/lib/finance';
import { today, safeDateInMonth } from '@/lib/helpers/date';
import { formatCurrency, formatDate } from '@/lib/helpers/format';
import { CalendarClock } from '@lucide/vue';
import Card from '@/components/ui/Card.vue';
import Tooltip from '@/components/ui/Tooltip.vue';

const data = useDataStore();

interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  daysAhead: number;
  dateLabel: string;
  badge?: { name: string; color: string | null; icon: string | null };
}

const items = computed<UpcomingItem[]>(() => {
  const ref = today();
  const todayDay = ref.date();
  const currentMonth = ref.month() + 1;
  const out: UpcomingItem[] = [];
  const dueDate = (day: number) =>
    formatDate(safeDateInMonth(ref.year(), ref.month(), day).toDate());

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
      dateLabel: dueDate(re.due_day),
      ...(cat ? { badge: { name: cat.name, color: cat.color, icon: cat.icon } } : {}),
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
      dateLabel: dueDate(card.due_day),
      badge: { name: 'Cartão', color: card.color, icon: '💳' },
    });
  }

  return out.sort((a, b) => a.daysAhead - b.daysAhead).slice(0, 5);
});

function dueLabel(d: number): string {
  if (d === 0) return 'vence hoje';
  if (d === 1) return 'amanhã';
  return `em ${d} dias`;
}

/** Tom do tile do dia conforme urgência. */
function dayTone(d: number): string {
  if (d <= 0) return 'bg-destructive/15 text-destructive';
  if (d <= 3) return 'bg-warning/15 text-warning';
  return 'bg-secondary text-muted-foreground';
}
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

    <ul v-if="items.length" class="space-y-1">
      <li
        v-for="it in items"
        :key="it.id"
        class="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-secondary/30"
      >
        <!-- Tile do dia -->
        <div
          :class="[
            'grid size-10 shrink-0 place-items-center rounded-xl',
            dayTone(it.daysAhead),
          ]"
        >
          <span class="text-base font-semibold tabular-nums">{{ it.dueDay }}</span>
        </div>

        <!-- Linha de cima: nome + categoria · Linha de baixo: data -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium">{{ it.name }}</span>
            <Tooltip v-if="it.badge" :text="it.badge.name">
              <span
                class="grid size-6 shrink-0 place-items-center rounded-full text-xs leading-none"
                :style="{ backgroundColor: `${it.badge.color ?? '#71717A'}1A` }"
              >
                {{ it.badge.icon || '🏷️' }}
              </span>
            </Tooltip>
          </div>
          <div class="mt-0.5 text-xs text-muted-foreground">
            {{ it.dateLabel }} · {{ dueLabel(it.daysAhead) }}
          </div>
        </div>

        <!-- Valor (centralizado nas duas linhas, à direita) -->
        <span class="shrink-0 tabular-nums text-sm font-medium text-destructive">
          {{ formatCurrency(it.amount) }}
        </span>
      </li>
    </ul>
    <p v-else class="py-4 text-center text-sm text-muted-foreground">
      Nenhuma conta a vencer este mês 🎉
    </p>
  </Card>
</template>
