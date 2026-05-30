<script setup lang="ts">
/**
 * InvoiceForm — "Lançar fatura do mês". Atalho para registrar a fatura inteira
 * de um cartão sem itemizar: o usuário informa o total e o mês de vencimento, e
 * criamos uma compra à vista (1 parcela) com a data ajustada para cair naquele
 * ciclo (via `purchaseDateForInvoiceMonth`).
 */
import { ref, computed } from 'vue';
import { useCreditCardStore } from '@/stores/creditCards';
import { useToast } from '@/composables/useToast';
import { purchaseDateForInvoiceMonth } from '@/lib/finance';
import { dayjs, today } from '@/lib/helpers/date';
import type { CreditCard } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ card: CreditCard }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useCreditCardStore();
const toast = useToast();

const total = ref<number>(0);

// Opções de mês: 2 atrás .. 3 à frente. value = YYYY-MM.
const monthOptions = computed(() => {
  const base = today().startOf('month');
  return Array.from({ length: 6 }, (_, i) => {
    const m = base.add(i - 2, 'month');
    return { value: m.format('YYYY-MM'), label: m.format('MMM/YYYY') };
  });
});
const invoiceMonth = ref<string>(today().format('YYYY-MM'));

const error = ref('');

async function onSubmit() {
  error.value = '';
  if (!total.value || total.value <= 0) {
    error.value = 'Informe o valor total da fatura.';
    return;
  }
  try {
    const label = dayjs(`${invoiceMonth.value}-01`).format('MMM/YYYY');
    await store.createPurchase({
      credit_card_id: props.card.id,
      description: `Fatura ${label}`,
      total_amount: total.value,
      installments: 1,
      purchase_date: purchaseDateForInvoiceMonth(props.card, invoiceMonth.value),
      category_id: null,
    });
    toast.success(`Fatura de ${label} lançada.`);
    emit('saved');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao lançar fatura.');
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <p class="text-sm text-muted-foreground">
      Lança a fatura cheia de uma vez (uma compra à vista no ciclo certo). Para
      acompanhar por categoria/parcela, use <strong>Nova compra</strong>.
    </p>

    <div class="space-y-1.5">
      <Label for="invoice_total">Total da fatura</Label>
      <MoneyInput id="invoice_total" v-model="total" required />
      <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
    </div>

    <div class="space-y-1.5">
      <Label>Mês de vencimento</Label>
      <Select v-model="invoiceMonth" :options="monthOptions" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">Lançar fatura</Button>
    </div>
  </form>
</template>
