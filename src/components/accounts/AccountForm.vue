<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAccountStore } from '@/stores/accounts';
import { useToast } from '@/composables/useToast';
import { accountSchema, type AccountFormValues } from '@/lib/schemas/account';
import type { Account } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import Switch from '@/components/ui/Switch.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: Account | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useAccountStore();
const toast = useToast();

interface FormState {
  name: string;
  type: 'bank' | 'cash';
  initial_balance: number;
  include_in_available: boolean;
  color: string;
}

const form = ref<FormState>({
  name: '',
  type: 'bank',
  initial_balance: 0,
  include_in_available: true,
  color: '#0A84FF',
});
const errors = ref<Partial<Record<keyof AccountFormValues, string>>>({});

watch(
  () => props.editing,
  (a) => {
    if (a) {
      form.value = {
        name: a.name,
        type: a.type,
        initial_balance: Number(a.initial_balance),
        include_in_available: a.include_in_available,
        color: a.color ?? '#0A84FF',
      };
    } else {
      form.value = { name: '', type: 'bank', initial_balance: 0, include_in_available: true, color: '#0A84FF' };
    }
    errors.value = {};
  },
  { immediate: true },
);

async function onSubmit() {
  const parsed = accountSchema.safeParse({
    name: form.value.name,
    type: form.value.type,
    initial_balance: form.value.initial_balance,
    include_in_available: form.value.include_in_available,
    color: form.value.color || null,
  });
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof AccountFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.update(props.editing.id, parsed.data);
      toast.success('Conta atualizada.');
    } else {
      await store.create({ ...parsed.data, color: parsed.data.color ?? null, icon: null });
      toast.success('Conta criada.');
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
      <Input id="name" v-model="form.name" placeholder="Ex.: Nubank, Carteira" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="space-y-1.5">
      <Label for="type">Tipo</Label>
      <Select
        v-model="form.type"
        :options="[
          { value: 'bank', label: 'Banco' },
          { value: 'cash', label: 'Dinheiro' },
        ]"
      />
    </div>

    <div class="space-y-1.5">
      <Label for="initial_balance">Saldo inicial</Label>
      <MoneyInput id="initial_balance" v-model="form.initial_balance" />
      <p class="text-xs text-muted-foreground">
        Quanto há nesta conta hoje. As próximas transações atualizam o saldo
        automaticamente.
      </p>
    </div>

    <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
      <div class="space-y-0.5">
        <p class="text-sm font-medium">Contar esta conta no saldo total</p>
        <p class="text-xs text-muted-foreground">
          Ligado: soma esta conta no “quanto você tem hoje”. Desligado: a conta
          existe pra registro, mas não entra nas contas do dia a dia.
        </p>
      </div>
      <Switch v-model="form.include_in_available" />
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
