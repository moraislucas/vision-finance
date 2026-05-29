<script setup lang="ts">
/**
 * Input — ESTILO.MD §10. h-11, focus com ring-primary/20 + borda primary/60.
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    autocomplete?: string;
    inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel';
    step?: string;
    min?: string | number;
    max?: string | number;
    invalid?: boolean;
    class?: string;
  }>(),
  { type: 'text', invalid: false },
);

defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
}>();

const classes = computed(() =>
  cn(
    'flex h-11 w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
    props.invalid &&
      'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20',
    props.class,
  ),
);
</script>

<template>
  <input
    :type="type"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :autocomplete="autocomplete"
    :inputmode="inputmode"
    :step="step"
    :min="min"
    :max="max"
    :aria-invalid="invalid || undefined"
    :class="classes"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @blur="$emit('blur', $event)"
  />
</template>
