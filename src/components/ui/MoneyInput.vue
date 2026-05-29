<script setup lang="ts">
/**
 * MoneyInput — input com máscara BRL "R$ 1.234,56".
 *
 * `v-model` expõe o NÚMERO em reais (1234.56), não a string mascarada.
 * O usuário só digita dígitos; o componente formata em tempo real e ignora
 * qualquer caractere não numérico.
 *
 * Usage:
 *   <MoneyInput v-model="amount" placeholder="0,00" required />
 */
import { computed, ref, watch } from 'vue';
import { maskCurrencyBRL, parseCurrencyBRL } from '@/lib/helpers/format';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    /** Permite valor negativo? Default false — adequado para finance. */
    allowNegative?: boolean;
    class?: string;
  }>(),
  { placeholder: 'R$ 0,00', allowNegative: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  blur: [event: FocusEvent];
}>();

// Display interno = string mascarada
const display = ref<string>(props.modelValue ? maskCurrencyBRL(String(Math.round((props.modelValue ?? 0) * 100))) : '');

watch(
  () => props.modelValue,
  (v) => {
    const newDisplay = v != null ? maskCurrencyBRL(String(Math.round(v * 100))) : '';
    // Só atualiza se diferente para não brigar com o usuário digitando.
    if (newDisplay !== display.value) display.value = newDisplay;
  },
);

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  display.value = maskCurrencyBRL(raw);
  const num = parseCurrencyBRL(display.value);
  emit('update:modelValue', num);
}

function onBlur(e: FocusEvent) {
  emit('blur', e);
}

const classes = computed(() =>
  cn(
    'flex h-11 w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 tabular-nums',
    props.invalid &&
      'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20',
    props.class,
  ),
);
</script>

<template>
  <input
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :value="display"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :aria-invalid="invalid || undefined"
    :class="classes"
    @input="onInput"
    @blur="onBlur"
  />
</template>
