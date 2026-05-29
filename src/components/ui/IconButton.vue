<script setup lang="ts">
/**
 * IconButton — botão quadrado pequeno com tooltip obrigatório (label fica em
 * `aria-label` E na tooltip). Reduz duplicação nas listas (editar/excluir/etc).
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';
import Tooltip from './Tooltip.vue';

const props = withDefaults(
  defineProps<{
    label: string;
    variant?: 'neutral' | 'danger';
    size?: 'sm' | 'md';
    disabled?: boolean;
    type?: 'button' | 'submit';
    class?: string;
  }>(),
  { variant: 'neutral', size: 'sm', disabled: false, type: 'button' },
);
defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() =>
  cn(
    'grid place-items-center rounded-lg transition-colors duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 disabled:pointer-events-none',
    props.size === 'md' ? 'size-9 [&_svg]:size-4' : 'size-8 [&_svg]:size-3.5',
    props.variant === 'neutral' &&
      'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
    props.variant === 'danger' &&
      'text-muted-foreground hover:bg-destructive/15 hover:text-destructive',
    props.class,
  ),
);
</script>

<template>
  <Tooltip :text="label">
    <button
      :type="type"
      :disabled="disabled"
      :aria-label="label"
      :class="classes"
      @click="$emit('click', $event)"
    >
      <slot />
    </button>
  </Tooltip>
</template>
