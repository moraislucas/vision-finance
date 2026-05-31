<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGoalStore } from '@/stores/goals';
import { useToast } from '@/composables/useToast';
import { goalSchema, type GoalFormValues } from '@/lib/schemas/goal';
import { dayjs, monthsUntil, today } from '@/lib/helpers/date';
import { formatCurrency } from '@/lib/helpers/format';
import type { Goal } from '@/types/domain';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Switch from '@/components/ui/Switch.vue';
import ColorPicker from '@/components/ui/ColorPicker.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';

const props = defineProps<{ editing?: Goal | null }>();
const emit = defineEmits<{ saved: []; cancel: [] }>();

const store = useGoalStore();
const toast = useToast();

type Mode = 'deadline' | 'monthly';
interface FormState {
  mode: Mode;
  name: string;
  target_amount: number;
  target_date: string;
  monthly_contribution: number;
  is_emergency: boolean;
  active: boolean;
  color: string;
}

const form = ref<FormState>({
  mode: 'deadline',
  name: '',
  target_amount: 0,
  target_date: '',
  monthly_contribution: 0,
  is_emergency: false,
  active: true,
  color: '#0A84FF',
});
const errors = ref<Partial<Record<keyof GoalFormValues, string>>>({});

// Simulador inline: quanto precisa guardar por mês para bater o prazo.
const previewMonthly = computed(() => {
  if (form.value.mode !== 'deadline') return null;
  if (!form.value.target_date || form.value.target_amount <= 0) return null;
  const target = dayjs(form.value.target_date);
  if (!target.isValid() || !target.isAfter(today())) return null;
  const months = monthsUntil(today(), target);
  const current = props.editing ? Number(props.editing.current_amount) : 0;
  const remaining = Math.max(0, form.value.target_amount - current);
  return Math.round((remaining / months) * 100) / 100;
});

watch(
  () => props.editing,
  (g) => {
    if (g) {
      form.value = {
        mode: g.target_date ? 'deadline' : 'monthly',
        name: g.name,
        target_amount: Number(g.target_amount),
        target_date: g.target_date ?? '',
        monthly_contribution:
          g.monthly_contribution != null ? Number(g.monthly_contribution) : 0,
        is_emergency: g.is_emergency,
        active: g.active,
        color: g.color ?? '#0A84FF',
      };
    } else {
      form.value = {
        mode: 'deadline',
        name: '',
        target_amount: 0,
        target_date: '',
        monthly_contribution: 0,
        is_emergency: false,
        active: true,
        color: '#0A84FF',
      };
    }
    errors.value = {};
  },
  { immediate: true },
);

async function onSubmit() {
  const candidate = {
    name: form.value.name,
    target_amount: form.value.target_amount,
    target_date: form.value.mode === 'deadline' ? form.value.target_date || null : null,
    monthly_contribution:
      form.value.mode === 'monthly' && form.value.monthly_contribution > 0
        ? form.value.monthly_contribution
        : null,
    is_emergency: form.value.is_emergency,
    active: form.value.active,
    color: form.value.color || null,
  };
  const parsed = goalSchema.safeParse(candidate);
  if (!parsed.success) {
    errors.value = {};
    for (const issue of parsed.error.issues) {
      errors.value[issue.path[0] as keyof GoalFormValues] = issue.message;
    }
    return;
  }
  try {
    if (props.editing) {
      await store.updateGoal(props.editing.id, parsed.data);
      toast.success('Meta atualizada.');
    } else {
      await store.createGoal({ ...parsed.data, color: parsed.data.color ?? null, icon: null });
      toast.success('Meta criada.');
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
      <Label for="name">Nome da meta</Label>
      <Input id="name" v-model="form.name" placeholder="Ex.: Viagem, Reserva de emergência" required />
      <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
    </div>

    <div class="space-y-1.5">
      <Label for="target_amount">Quanto deseja juntar</Label>
      <MoneyInput id="target_amount" v-model="form.target_amount" required />
      <p v-if="errors.target_amount" class="text-xs text-destructive">{{ errors.target_amount }}</p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button
        type="button"
        :class="[
          'h-10 rounded-md border text-sm font-medium',
          form.mode === 'deadline' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary/60',
        ]"
        @click="form.mode = 'deadline'"
      >
        Com prazo
      </button>
      <button
        type="button"
        :class="[
          'h-10 rounded-md border text-sm font-medium',
          form.mode === 'monthly' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary/60',
        ]"
        @click="form.mode = 'monthly'"
      >
        Por mês fixo
      </button>
    </div>

    <div v-if="form.mode === 'deadline'" class="space-y-1.5">
      <Label for="target_date">Data alvo</Label>
      <Input id="target_date" v-model="form.target_date" type="date" required />
      <p
        v-if="previewMonthly !== null"
        class="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs leading-relaxed text-primary"
      >
        Você precisa guardar
        <span class="font-semibold tabular-nums">{{ formatCurrency(previewMonthly) }}/mês</span>
        pra chegar lá.
      </p>
    </div>
    <div v-else class="space-y-1.5">
      <Label for="monthly_contribution">Contribuição mensal</Label>
      <MoneyInput id="monthly_contribution" v-model="form.monthly_contribution" required />
      <p v-if="errors.monthly_contribution" class="text-xs text-destructive">{{ errors.monthly_contribution }}</p>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <div class="space-y-0.5">
          <p class="text-sm font-medium">É minha reserva de emergência</p>
          <p class="text-xs text-muted-foreground">
            Usada como referência para o score: o ideal é cobrir 3× suas despesas fixas.
          </p>
        </div>
        <Switch v-model="form.is_emergency" />
      </div>
      <div class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
        <div class="space-y-0.5">
          <p class="text-sm font-medium">Guardar para esta meta</p>
          <p class="text-xs text-muted-foreground">
            Quando ligado, o app reserva a contribuição mensal antes de calcular
            quanto você pode gastar.
          </p>
        </div>
        <Switch v-model="form.active" />
      </div>
    </div>

    <div class="space-y-2">
      <Label>Cor</Label>
      <ColorPicker v-model="form.color" />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="outline" type="button" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :loading="store.saving">{{ editing ? 'Salvar' : 'Criar meta' }}</Button>
    </div>
  </form>
</template>
