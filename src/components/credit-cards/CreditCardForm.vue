<script setup lang="ts">
import { ref, watch } from 'vue';
import { useCreditCardStore } from '@/stores/creditCards';
import { useToast } from '@/composables/useToast';
import { creditCardSchema, type CreditCardFormValues } from '@/lib/schemas/creditCard';
import type { CreditCard } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Switch from '@/components/ui/Switch.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: CreditCard | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useCreditCardStore();
const toast = useToast();

interface FormState {
  name: string;
  limit_amount: number;
  closing_day: string;
  due_day: string;
  active: boolean;
  color: string;
}
const form = ref<FormState>({
  name: '',
  limit_amount: 0,
  closing_day: '25',
  due_day: '5',
  active: true,
  color: '#0A84FF',
});
const errors = ref<Partial<Record<keyof CreditCardFormValues, string>>>({});

watch(
  () => props.editing,
  (c) => {
    if (c) {
      form.value = {
        name: c.name,
        limit_amount: Number(c.limit_amount),
        closing_day: String(c.closing_day),
        due_day: String(c.due_day),
        active: c.active,
        color: c.color ?? '#0A84FF',
      };
    } else {
      form.value = { name: '', limit_amount: 0, closing_day: '25', due_day: '5', active: true, color: '#0A84FF' };
    }
    errors.value = {};
  },
  { immediate: true },
);

async function onSubmit() {
  const parsed = creditCardSchema.safeParse(form.value);
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof CreditCardFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.update(props.editing.id, parsed.data);
      toast.success('Cartão atualizado.');
    } else {
      await store.create({ ...parsed.data, color: parsed.data.color ?? null, icon: null });
      toast.success('Cartão criado.');
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
      <Input id="name" v-model="form.name" placeholder="Ex.: Nubank, Inter Gold" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="space-y-1.5">
      <Label for="limit_amount">Limite total</Label>
      <MoneyInput id="limit_amount" v-model="form.limit_amount" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1.5">
        <Label for="closing_day">Dia de fechamento</Label>
        <Input id="closing_day" v-model="form.closing_day" type="number" min="1" max="31" required />
      </div>
      <div class="space-y-1.5">
        <Label for="due_day">Dia de vencimento</Label>
        <Input id="due_day" v-model="form.due_day" type="number" min="1" max="31" required />
      </div>
    </div>

    <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <div class="space-y-0.5">
        <p class="text-sm font-medium">Usar este cartão</p>
        <p class="text-xs text-muted-foreground">
          Quando desligado, o cartão fica salvo, mas suas faturas e parcelas não
          entram nos cálculos de quanto você pode gastar.
        </p>
      </div>
      <Switch v-model="form.active" />
    </div>

    <div class="space-y-2">
      <Label>Cor</Label>
      <ColorPicker v-model="form.color" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">{{ editing ? 'Salvar' : 'Adicionar' }}</Button>
    </div>
  </form>
</template>
