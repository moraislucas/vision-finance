<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDataStore } from '@/stores/data';
import { useCreditCardStore } from '@/stores/creditCards';
import { useToast } from '@/composables/useToast';
import { purchaseSchema, type PurchaseFormValues } from '@/lib/schemas/creditCard';
import { dayjs } from '@/lib/helpers/date';
import { formatCurrency } from '@/lib/helpers/format';
import type { CreditCardPurchase } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ cardId: string; editing?: CreditCardPurchase | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const data = useDataStore();
const store = useCreditCardStore();
const toast = useToast();

interface FormState {
  description: string;
  total_amount: number;
  installments: string;
  purchase_date: string;
  category_id: string | null;
}
const form = ref<FormState>({
  description: '',
  total_amount: 0,
  installments: '1',
  purchase_date: dayjs().format('YYYY-MM-DD'),
  category_id: null,
});
const errors = ref<Partial<Record<keyof PurchaseFormValues, string>>>({});

watch(
  () => props.editing,
  (p) => {
    if (p) {
      form.value = {
        description: p.description,
        total_amount: Number(p.total_amount),
        installments: String(p.installments),
        purchase_date: p.purchase_date,
        category_id: p.category_id,
      };
    } else {
      form.value = {
        description: '',
        total_amount: 0,
        installments: '1',
        purchase_date: dayjs().format('YYYY-MM-DD'),
        category_id: null,
      };
    }
    errors.value = {};
  },
  { immediate: true },
);

const installmentValue = computed(() => {
  const total = form.value.total_amount;
  const n = Number(form.value.installments || 1);
  if (!total || !n) return 0;
  return total / n;
});

const categoryOptions = computed(() => [
  { value: null as string | null, label: 'Sem categoria' },
  ...data.categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({ value: c.id, label: `${c.icon ?? '🏷️'} ${c.name}` })),
]);

async function onSubmit() {
  const parsed = purchaseSchema.safeParse({ ...form.value, credit_card_id: props.cardId });
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof PurchaseFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.updatePurchase(props.editing.id, parsed.data);
      toast.success('Compra atualizada.');
    } else {
      await store.createPurchase(parsed.data);
      toast.success('Compra criada — parcelas projetadas.');
    }
    emit('saved');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="space-y-1.5">
      <Label for="description">Descrição</Label>
      <Input id="description" v-model="form.description" placeholder="Ex.: Notebook" required />
      <p v-if="errors.description" class="text-xs text-destructive">
        {{ errors.description }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label for="total_amount">Valor total</Label>
        <MoneyInput id="total_amount" v-model="form.total_amount" required />
        <p v-if="errors.total_amount" class="text-xs text-destructive">
          {{ errors.total_amount }}
        </p>
      </div>
      <div class="space-y-1.5">
        <Label for="installments">Parcelas</Label>
        <Input
          id="installments"
          v-model="form.installments"
          type="number"
          min="1"
          max="36"
          required
        />
        <p v-if="errors.installments" class="text-xs text-destructive">
          {{ errors.installments }}
        </p>
      </div>
    </div>

    <p v-if="installmentValue > 0" class="text-xs text-muted-foreground">
      Parcelas de {{ formatCurrency(installmentValue) }} (a última corrige centavos).
    </p>

    <div class="space-y-1.5">
      <Label for="purchase_date">Data da compra</Label>
      <Input id="purchase_date" v-model="form.purchase_date" type="date" required />
    </div>

    <div class="space-y-1.5">
      <Label>Categoria</Label>
      <Select v-model="form.category_id" :options="categoryOptions" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">
        {{ editing ? 'Salvar' : 'Adicionar' }}
      </Button>
    </div>
  </form>
</template>
