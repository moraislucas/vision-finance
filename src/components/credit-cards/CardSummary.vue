<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, Trash2, Plus, Receipt } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import {
  getCardInvoice,
  getCardAvailableLimit,
} from '@/lib/finance';
import { today } from '@/lib/helpers/date';
import { formatCurrency, formatPercent } from '@/lib/helpers/format';
import type { CreditCard } from '@/types/domain';
import Card from '@/components/ui/Card.vue';
import Badge from '@/components/ui/Badge.vue';
import IconButton from '@/components/ui/IconButton.vue';
import BankLogo from '@/components/ui/BankLogo.vue';

const props = defineProps<{ card: CreditCard }>();
const emit = defineEmits<{ edit: []; remove: []; newPurchase: []; newInvoice: []; openDetail: [] }>();

const data = useDataStore();

const invoice = computed(() =>
  getCardInvoice(props.card, data.creditCardPurchases, today()),
);
const available = computed(() => getCardAvailableLimit(props.card, data.creditCardPurchases));
const usagePct = computed(() => {
  const limit = Number(props.card.limit_amount);
  if (limit <= 0) return 0;
  return Math.max(0, Math.min(1, (limit - available.value) / limit));
});
</script>

<template>
  <Card class="overflow-hidden">
    <button class="w-full p-4 text-left" type="button" @click="emit('openDetail')">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2.5">
            <BankLogo :slug="card.icon" :name="card.name" :color="card.color" size="sm" />
            <h3 class="truncate text-base font-semibold">{{ card.name }}</h3>
            <Badge v-if="!card.active" size="sm">Inativo</Badge>
          </div>
          <p class="mt-0.5 text-xs text-muted-foreground">
            Fechamento dia {{ card.closing_day }} · Vencimento dia {{ card.due_day }}
          </p>
        </div>
        <div class="flex shrink-0 gap-1" @click.stop>
          <IconButton label="Editar cartão" @click="emit('edit')">
            <Pencil />
          </IconButton>
          <IconButton label="Excluir cartão" variant="danger" @click="emit('remove')">
            <Trash2 />
          </IconButton>
        </div>
      </header>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div class="text-xs uppercase tracking-wider text-muted-foreground">Fatura atual</div>
          <div class="mt-1 tabular-nums text-xl font-semibold">{{ formatCurrency(invoice.total) }}</div>
          <div class="text-xs text-muted-foreground">{{ invoice.lines.length }} parcelas neste mês</div>
        </div>
        <div>
          <div class="text-xs uppercase tracking-wider text-muted-foreground">Limite disponível</div>
          <div class="mt-1 tabular-nums text-xl font-semibold">{{ formatCurrency(available) }}</div>
          <div class="text-xs text-muted-foreground">de {{ formatCurrency(Number(card.limit_amount)) }}</div>
        </div>
      </div>

      <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          class="h-full transition-[width]"
          :style="{ width: `${Math.max(2, usagePct * 100)}%`, backgroundColor: card.color ?? '#0A84FF' }"
        />
      </div>
      <div class="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ formatPercent(usagePct) }} comprometido</span>
        <span>ver detalhe →</span>
      </div>
    </button>

    <div class="grid grid-cols-2 gap-2 border-t border-border p-3">
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/60"
        @click="emit('newPurchase')"
      >
        <Plus class="h-4 w-4" />
        Nova compra
      </button>
      <button
        type="button"
        class="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/60"
        @click="emit('newInvoice')"
      >
        <Receipt class="h-4 w-4" />
        Lançar fatura
      </button>
    </div>
  </Card>
</template>
