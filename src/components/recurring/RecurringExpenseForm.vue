<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDataStore } from '@/stores/data';
import { useRecurringExpenseStore } from '@/stores/recurring';
import { useToast } from '@/composables/useToast';
import { recurringExpenseSchema, type RecurringExpenseFormValues } from '@/lib/schemas/recurring';
import type { RecurringExpense } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import Switch from '@/components/ui/Switch.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: RecurringExpense | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const data = useDataStore();
const store = useRecurringExpenseStore();
const toast = useToast();

interface FormState {
  name: string;
  amount: number;
  due_day: string;
  frequency: 'monthly' | 'yearly';
  due_month: string;
  category_id: string | null;
  active: boolean;
}

const form = ref<FormState>({
  name: '',
  amount: 0,
  due_day: '10',
  frequency: 'monthly',
  due_month: '',
  category_id: null,
  active: true,
});
const errors = ref<Partial<Record<keyof RecurringExpenseFormValues, string>>>({});

watch(
  () => props.editing,
  (re) => {
    if (re) {
      form.value = {
        name: re.name,
        amount: Number(re.amount),
        due_day: String(re.due_day),
        frequency: re.frequency,
        due_month: re.due_month != null ? String(re.due_month) : '',
        category_id: re.category_id,
        active: re.active,
      };
    } else {
      form.value = {
        name: '',
        amount: 0,
        due_day: '10',
        frequency: 'monthly',
        due_month: '',
        category_id: null,
        active: true,
      };
    }
    errors.value = {};
  },
  { immediate: true },
);

watch(
  () => form.value.frequency,
  (f) => {
    if (f === 'monthly') form.value.due_month = '';
  },
);

const categoryOptions = computed(() => [
  { value: null as string | null, label: 'Sem categoria' },
  ...data.categories
    .filter((c) => c.type === 'expense')
    .map((c) => ({ value: c.id, label: `${c.icon ?? '🏷️'} ${c.name}` })),
]);

const monthOptions = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

async function onSubmit() {
  const candidate = {
    ...form.value,
    due_month: form.value.frequency === 'yearly' ? (form.value.due_month ? Number(form.value.due_month) : null) : null,
  };
  const parsed = recurringExpenseSchema.safeParse(candidate);
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof RecurringExpenseFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.update(props.editing.id, parsed.data);
      toast.success('Despesa fixa atualizada.');
    } else {
      await store.create(parsed.data);
      toast.success('Despesa fixa criada.');
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
      <Label for="name">Nome</Label>
      <Input id="name" v-model="form.name" placeholder="Ex.: Aluguel, Internet, IPTU" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label for="amount">Valor</Label>
        <MoneyInput id="amount" v-model="form.amount" required />
        <p v-if="errors.amount" class="text-xs text-destructive">{{ errors.amount }}</p>
      </div>
      <div class="space-y-1.5">
        <Label for="due_day">Dia do vencimento</Label>
        <Input id="due_day" v-model="form.due_day" type="number" min="1" max="31" required />
        <p v-if="errors.due_day" class="text-xs text-destructive">{{ errors.due_day }}</p>
      </div>
    </div>

    <div class="space-y-1.5">
      <Label>Frequência</Label>
      <Select
        v-model="form.frequency"
        :options="[
          { value: 'monthly', label: 'Mensal' },
          { value: 'yearly', label: 'Anual' },
        ]"
      />
    </div>

    <div v-if="form.frequency === 'yearly'" class="space-y-1.5">
      <Label for="due_month">Mês do vencimento</Label>
      <Select
        v-model="form.due_month"
        :options="monthOptions.map((m) => ({ value: String(m.value), label: m.label }))"
        placeholder="Selecione…"
      />
      <p v-if="errors.due_month" class="text-xs text-destructive">{{ errors.due_month }}</p>
    </div>

    <div class="space-y-1.5">
      <Label>Categoria</Label>
      <Select v-model="form.category_id" :options="categoryOptions" />
    </div>

    <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <div class="space-y-0.5">
        <p class="text-sm font-medium">Pagar esta despesa</p>
        <p class="text-xs text-muted-foreground">
          Quando ligado, o app considera esse compromisso ao calcular quanto você
          pode gastar no mês e nas projeções futuras.
        </p>
      </div>
      <Switch v-model="form.active" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">{{ editing ? 'Salvar' : 'Adicionar' }}</Button>
    </div>
  </form>
</template>
