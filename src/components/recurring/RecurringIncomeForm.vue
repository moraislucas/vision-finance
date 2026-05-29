<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRecurringIncomeStore } from '@/stores/recurring';
import { useToast } from '@/composables/useToast';
import { recurringIncomeSchema, type RecurringIncomeFormValues } from '@/lib/schemas/recurring';
import type { RecurringIncome } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Switch from '@/components/ui/Switch.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: RecurringIncome | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useRecurringIncomeStore();
const toast = useToast();

interface FormState {
  name: string;
  amount: number;
  day_of_month: string;
  active: boolean;
}

const form = ref<FormState>({ name: '', amount: 0, day_of_month: '5', active: true });
const errors = ref<Partial<Record<keyof RecurringIncomeFormValues, string>>>({});

watch(
  () => props.editing,
  (ri) => {
    if (ri) {
      form.value = {
        name: ri.name,
        amount: Number(ri.amount),
        day_of_month: String(ri.day_of_month),
        active: ri.active,
      };
    } else {
      form.value = { name: '', amount: 0, day_of_month: '5', active: true };
    }
    errors.value = {};
  },
  { immediate: true },
);

async function onSubmit() {
  const parsed = recurringIncomeSchema.safeParse(form.value);
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof RecurringIncomeFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.update(props.editing.id, parsed.data);
      toast.success('Receita recorrente atualizada.');
    } else {
      await store.create(parsed.data);
      toast.success('Receita recorrente criada.');
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
      <Input id="name" v-model="form.name" placeholder="Ex.: Salário" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label for="amount">Valor</Label>
        <MoneyInput id="amount" v-model="form.amount" required />
        <p v-if="errors.amount" class="text-xs text-destructive">{{ errors.amount }}</p>
      </div>
      <div class="space-y-1.5">
        <Label for="day_of_month">Dia do mês</Label>
        <Input id="day_of_month" v-model="form.day_of_month" type="number" min="1" max="31" required />
        <p v-if="errors.day_of_month" class="text-xs text-destructive">{{ errors.day_of_month }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <div class="space-y-0.5">
        <p class="text-sm font-medium">Receber esta receita</p>
        <p class="text-xs text-muted-foreground">
          Quando ligado, o app considera que esse dinheiro vai entrar no mês e usa
          essa informação na projeção futura.
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
