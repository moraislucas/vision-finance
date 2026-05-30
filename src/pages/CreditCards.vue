<script setup lang="ts">
import { ref } from 'vue';
import { CreditCard } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useCreditCardStore } from '@/stores/creditCards';
import { useToast } from '@/composables/useToast';
import type { CreditCard as CreditCardModel } from '@/types/domain';

import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue';
import Button from '@/components/ui/Button.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FloatingAddButton from '@/components/layout/FloatingAddButton.vue';
import CardSummary from '@/components/credit-cards/CardSummary.vue';
import CardDetail from '@/components/credit-cards/CardDetail.vue';
import CreditCardForm from '@/components/credit-cards/CreditCardForm.vue';
import PurchaseForm from '@/components/credit-cards/PurchaseForm.vue';
import InvoiceForm from '@/components/credit-cards/InvoiceForm.vue';

const data = useDataStore();
const store = useCreditCardStore();
const toast = useToast();

const cardSheetOpen = ref(false);
const editingCard = ref<CreditCardModel | null>(null);

const purchaseSheetOpen = ref(false);
const purchaseCardId = ref<string | null>(null);

const invoiceSheetOpen = ref(false);
const invoiceCard = ref<CreditCardModel | null>(null);

const detailSheetOpen = ref(false);
const detailCard = ref<CreditCardModel | null>(null);

const confirmOpen = ref(false);
const toDelete = ref<CreditCardModel | null>(null);

function openCreate() {
  editingCard.value = null;
  cardSheetOpen.value = true;
}
function openEdit(c: CreditCardModel) {
  editingCard.value = c;
  cardSheetOpen.value = true;
}
function openPurchase(c: CreditCardModel) {
  purchaseCardId.value = c.id;
  purchaseSheetOpen.value = true;
}
function openInvoice(c: CreditCardModel) {
  invoiceCard.value = c;
  invoiceSheetOpen.value = true;
}
function openDetail(c: CreditCardModel) {
  detailCard.value = c;
  detailSheetOpen.value = true;
}
function askDelete(c: CreditCardModel) {
  toDelete.value = c;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.remove(toDelete.value.id);
    toast.success('Cartão excluído.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDelete.value = null;
  }
}
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Crédito"
      title="Cartões"
      description="Cadastre seus cartões e compras parceladas. O app projeta as faturas dos próximos meses."
    >
      <template #actions>
        <Button @click="openCreate">+ Novo cartão</Button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <SkeletonGrid v-if="!data.loaded" :count="3" height="h-52" />

    <!-- Empty -->
    <EmptyState
      v-else-if="data.creditCards.length === 0"
      title="Nenhum cartão"
      description="Cadastre seu cartão de crédito para acompanhar a fatura atual e o cronograma de parcelas dos próximos meses."
      :icon="CreditCard"
    >
      <Button @click="openCreate">+ Cadastrar primeiro cartão</Button>
    </EmptyState>

    <!-- Cards -->
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <CardSummary
        v-for="card in data.creditCards"
        :key="card.id"
        :card="card"
        @edit="openEdit(card)"
        @remove="askDelete(card)"
        @new-purchase="openPurchase(card)"
        @new-invoice="openInvoice(card)"
        @open-detail="openDetail(card)"
      />
    </div>

    <Sheet
      :open="cardSheetOpen"
      :title="editingCard ? 'Editar cartão' : 'Novo cartão'"
      @update:open="cardSheetOpen = $event"
    >
      <CreditCardForm
        :editing="editingCard"
        @saved="cardSheetOpen = false"
        @cancel="cardSheetOpen = false"
      />
    </Sheet>

    <Sheet
      :open="purchaseSheetOpen"
      title="Nova compra no cartão"
      @update:open="purchaseSheetOpen = $event"
    >
      <PurchaseForm
        v-if="purchaseCardId"
        :card-id="purchaseCardId"
        @saved="purchaseSheetOpen = false"
        @cancel="purchaseSheetOpen = false"
      />
    </Sheet>

    <Sheet
      :open="invoiceSheetOpen"
      title="Lançar fatura do mês"
      @update:open="invoiceSheetOpen = $event"
    >
      <InvoiceForm
        v-if="invoiceCard"
        :card="invoiceCard"
        @saved="invoiceSheetOpen = false"
        @cancel="invoiceSheetOpen = false"
      />
    </Sheet>

    <Sheet
      :open="detailSheetOpen"
      :title="detailCard?.name ?? 'Cartão'"
      :size="'lg'"
      @update:open="detailSheetOpen = $event"
    >
      <CardDetail v-if="detailCard" :card="detailCard" />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Excluir cartão?"
      :description="
        toDelete
          ? `“${toDelete.name}” será removido junto com todas as compras e parcelas. Esta ação não pode ser desfeita.`
          : ''
      "
      confirm-text="Excluir cartão"
      destructive
      @confirm="doDelete"
    />

    <FloatingAddButton class="md:hidden" label="Novo cartão" @click="openCreate" />
  </section>
</template>
