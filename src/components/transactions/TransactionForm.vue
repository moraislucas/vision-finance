<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDataStore } from '@/stores/data';
import { useTransactionStore } from '@/stores/transactions';
import { useToast } from '@/composables/useToast';
import { transactionSchema, type TransactionFormValues } from '@/lib/schemas/transaction';
import { dayjs } from '@/lib/helpers/date';
import type { Transaction } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: Transaction | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const data = useDataStore();
const store = useTransactionStore();
const toast = useToast();

interface FormState {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category_id: string | null;
  account_id: string | null;
  notes: string;
}

const form = ref<FormState>({
  type: 'expense',
  description: '',
  amount: 0,
  date: dayjs().format('YYYY-MM-DD'),
  category_id: null,
  account_id: null,
  notes: '',
});
const errors = ref<Partial<Record<keyof TransactionFormValues, string>>>({});

watch(
  () => props.editing,
  (tx) => {
    if (tx) {
      form.value = {
        type: tx.type,
        description: tx.description,
        amount: Number(tx.amount),
        date: tx.date,
        category_id: tx.category_id,
        account_id: tx.account_id,
        notes: tx.notes ?? '',
      };
    } else {
      form.value = {
        type: 'expense',
        description: '',
        amount: 0,
        date: dayjs().format('YYYY-MM-DD'),
        category_id: null,
        account_id: null,
        notes: '',
      };
    }
    errors.value = {};
  },
  { immediate: true },
);

const categoryOptions = computed(() =>
  data.categories
    .filter((c) => c.type === form.value.type)
    .map((c) => ({ value: c.id, label: c.name })),
);
const accountOptions = computed(() =>
  data.accounts.map((a) => ({ value: a.id, label: a.name })),
);

async function onSubmit() {
  const parsed = transactionSchema.safeParse({
    ...form.value,
    notes: form.value.notes || null,
  });
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof TransactionFormValues;
      errors.value[key] = issue.message;
    }
    return;
  }
  const v = parsed.data;
  try {
    if (props.editing) {
      await store.update(props.editing.id, {
        type: v.type,
        description: v.description,
        amount: v.amount,
        date: v.date,
        category_id: v.category_id,
        account_id: v.account_id,
        notes: v.notes ?? null,
      });
      toast.success('Transação atualizada.');
    } else {
      await store.create({
        type: v.type,
        description: v.description,
        amount: v.amount,
        date: v.date,
        category_id: v.category_id,
        account_id: v.account_id,
        notes: v.notes ?? null,
        recurring_income_id: null,
        recurring_expense_id: null,
        credit_card_purchase_id: null,
      });
      toast.success('Transação criada.');
    }
    emit('saved');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        :class="[
          'h-10 rounded-md border text-sm font-medium transition-colors',
          form.type === 'expense' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground hover:bg-secondary/60',
        ]"
        @click="form.type = 'expense'"
      >
        Despesa
      </button>
      <button
        type="button"
        :class="[
          'h-10 rounded-md border text-sm font-medium transition-colors',
          form.type === 'income' ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:bg-secondary/60',
        ]"
        @click="form.type = 'income'"
      >
        Receita
      </button>
    </div>

    <div class="space-y-1.5">
      <Label for="description">Descrição</Label>
      <Input id="description" v-model="form.description" required placeholder="Ex.: Mercado da semana" />
      <p v-if="errors.description" class="text-xs text-destructive">{{ errors.description }}</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label for="amount">Valor</Label>
        <MoneyInput id="amount" v-model="form.amount" required />
        <p v-if="errors.amount" class="text-xs text-destructive">{{ errors.amount }}</p>
      </div>

      <div class="space-y-1.5">
        <Label for="date">Data</Label>
        <Input id="date" v-model="form.date" type="date" required />
        <p v-if="errors.date" class="text-xs text-destructive">{{ errors.date }}</p>
      </div>
    </div>

    <div class="space-y-1.5">
      <Label for="category_id">Categoria</Label>
      <Select v-model="form.category_id" :options="categoryOptions" placeholder="Selecione…" />
      <p v-if="errors.category_id" class="text-xs text-destructive">{{ errors.category_id }}</p>
    </div>

    <div class="space-y-1.5">
      <Label for="account_id">Conta</Label>
      <Select v-model="form.account_id" :options="accountOptions" placeholder="Selecione…" />
      <p v-if="errors.account_id" class="text-xs text-destructive">{{ errors.account_id }}</p>
    </div>

    <div class="space-y-1.5">
      <Label for="notes">Observações (opcional)</Label>
      <Input id="notes" v-model="form.notes" placeholder="Detalhes adicionais" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">
        {{ editing ? 'Salvar' : 'Adicionar' }}
      </Button>
    </div>
  </form>
</template>
