<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDataStore } from '@/stores/data';
import { getCardInvoice, expandPurchase } from '@/lib/finance';
import { dayjs, today } from '@/lib/helpers/date';
import { formatCurrency, formatDate } from '@/lib/helpers/format';
import type { CreditCard, CreditCardPurchase } from '@/types/domain';
import { Trash2 } from '@lucide/vue';
import { useCreditCardStore } from '@/stores/creditCards';
import { useToast } from '@/composables/useToast';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import IconButton from '@/components/ui/IconButton.vue';

const props = defineProps<{ card: CreditCard }>();
const data = useDataStore();
const store = useCreditCardStore();
const toast = useToast();

const nextInvoices = computed(() => {
  const ref = today();
  return Array.from({ length: 6 }, (_, i) => {
    const m = ref.add(i, 'month');
    return getCardInvoice(props.card, data.creditCardPurchases, m);
  });
});

const purchases = computed(() =>
  data.creditCardPurchases
    .filter((p) => p.credit_card_id === props.card.id)
    .sort((a, b) => (a.purchase_date > b.purchase_date ? -1 : 1)),
);

function monthLabel(ym: string): string {
  return dayjs(`${ym}-01`).format('MMM/YY');
}

const confirmDeleteOpen = ref(false);
const toDelete = ref<CreditCardPurchase | null>(null);

function askDelete(p: CreditCardPurchase) {
  toDelete.value = p;
  confirmDeleteOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.removePurchase(toDelete.value.id);
    toast.success('Compra removida.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro.');
  } finally {
    toDelete.value = null;
  }
}

function lastDueDate(purchaseId: string): string | null {
  const p = data.creditCardPurchases.find((x) => x.id === purchaseId);
  if (!p) return null;
  const lines = expandPurchase(p, props.card);
  return lines[lines.length - 1]?.dueDate ?? null;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Próximas 6 faturas -->
    <section>
      <h3 class="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
        Próximas faturas
      </h3>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div
          v-for="inv in nextInvoices"
          :key="inv.month"
          class="rounded-xl border border-border bg-secondary/30 p-3"
        >
          <div class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
            {{ monthLabel(inv.month) }}
          </div>
          <div class="mt-1 tabular-nums text-sm font-semibold">
            {{ formatCurrency(inv.total) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Lista de compras -->
    <section>
      <h3 class="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
        Compras
      </h3>
      <ul
        v-if="purchases.length"
        class="divide-y divide-border rounded-xl border border-border"
      >
        <li
          v-for="p in purchases"
          :key="p.id"
          class="flex items-center justify-between gap-3 px-3 py-2.5"
        >
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">{{ p.description }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatDate(p.purchase_date) }}
              <span v-if="p.installments > 1">
                · {{ p.installments }}x
                <span v-if="lastDueDate(p.id)">
                  · termina {{ formatDate(lastDueDate(p.id)!) }}
                </span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="tabular-nums text-sm">{{ formatCurrency(Number(p.total_amount)) }}</span>
            <IconButton label="Excluir compra" variant="danger" @click="askDelete(p)">
              <Trash2 />
            </IconButton>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-muted-foreground">Nenhuma compra registrada.</p>
    </section>

    <ConfirmDialog
      v-model:open="confirmDeleteOpen"
      title="Excluir compra?"
      :description="
        toDelete
          ? `“${toDelete.description}” será removida junto com todas as parcelas projetadas.`
          : ''
      "
      confirm-text="Excluir compra"
      destructive
      @confirm="doDelete"
    />
  </div>
</template>
