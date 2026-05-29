<script setup lang="ts">
/**
 * StatusDot — pontinho colorido com pulse opcional. ESTILO.MD §10.
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
    size?: 'sm' | 'md';
    pulse?: boolean;
    class?: string;
  }>(),
  { tone: 'primary', size: 'md', pulse: false },
);

const toneClass: Record<NonNullable<typeof props.tone>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground',
};
const sizeClass: Record<NonNullable<typeof props.size>, string> = {
  sm: 'size-1.5',
  md: 'size-2',
};

const classes = computed(() =>
  cn(
    'relative inline-flex rounded-full',
    toneClass[props.tone],
    sizeClass[props.size],
    props.class,
  ),
);
</script>

<template>
  <span :class="classes">
    <span
      v-if="pulse"
      class="absolute inset-0 animate-ping rounded-full opacity-60"
      :class="toneClass[tone]"
    />
  </span>
</template>
