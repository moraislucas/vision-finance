<script setup lang="ts" generic="T extends string | number | null">
/**
 * Select — input nativo estilizado para combinar com Input.vue.
 * `appearance-none` + `ChevronDown` absoluto à direita (§10).
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';
import { ChevronDown } from '@lucide/vue';

const props = defineProps<{
  modelValue: T;
  options: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  class?: string;
}>();
defineEmits<{ 'update:modelValue': [value: T] }>();

const classes = computed(() =>
  cn(
    'flex h-11 w-full appearance-none rounded-xl border border-input bg-secondary/40 px-3.5 pr-10 py-2 text-sm text-foreground transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
    props.invalid &&
      'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20',
    props.class,
  ),
);
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue as unknown as string"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      :class="classes"
      @change="
        $emit(
          'update:modelValue',
          ($event.target as HTMLSelectElement).value as unknown as T,
        )
      "
    >
      <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value as unknown as string"
      >
        {{ opt.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
  </div>
</template>
