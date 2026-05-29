<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGoalStore } from '@/stores/goals';
import { useToast } from '@/composables/useToast';
import { contributionSchema, type ContributionFormValues } from '@/lib/schemas/goal';
import { dayjs } from '@/lib/helpers/date';
import type { Goal } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ goal: Goal; mode: 'deposit' | 'withdraw' }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useGoalStore();
const toast = useToast();

interface FormState {
  amount: number;
  date: string;
}
const form = ref<FormState>({ amount: 0, date: dayjs().format('YYYY-MM-DD') });
const errors = ref<Partial<Record<keyof ContributionFormValues, string>>>({});

watch(
  () => props.goal.id,
  () => {
    form.value = { amount: 0, date: dayjs().format('YYYY-MM-DD') };
    errors.value = {};
  },
);

async function onSubmit() {
  const parsed = contributionSchema.safeParse({
    amount: form.value.amount,
    date: form.value.date,
  });
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof ContributionFormValues] = issue.message;
    }
    return;
  }
  const signed =
    props.mode === 'deposit'
      ? Math.abs(parsed.data.amount)
      : -Math.abs(parsed.data.amount);
  try {
    await store.addContribution(props.goal.id, signed, parsed.data.date);
    toast.success(
      props.mode === 'deposit' ? 'Aporte registrado.' : 'Resgate registrado.',
    );
    emit('saved');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao registrar.');
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <p class="text-sm text-muted-foreground">
      <span v-if="mode === 'deposit'">Quanto você está separando para</span>
      <span v-else>Quanto você está resgatando de</span>
      <strong class="text-foreground"> {{ goal.name }}</strong
      >?
    </p>

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

    <p class="text-xs text-muted-foreground">
      Aporte é "earmark": o dinheiro continua na sua conta, mas o app reserva
      para esta meta e desconta do que você pode gastar.
    </p>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button
        type="submit"
        :variant="mode === 'withdraw' ? 'destructive' : 'default'"
        :loading="store.saving"
      >
        {{ mode === 'deposit' ? 'Guardar' : 'Resgatar' }}
      </Button>
    </div>
  </form>
</template>
