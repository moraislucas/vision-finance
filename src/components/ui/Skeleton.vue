<script setup lang="ts">
/**
 * Skeleton (shimmer) — ESTILO.MD §10.
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    variant?: 'rect' | 'text' | 'circle';
    class?: string;
  }>(),
  { variant: 'rect' },
);

const classes = computed(() =>
  cn(
    'relative overflow-hidden bg-secondary/60',
    'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.06] after:to-transparent',
    props.variant === 'rect' && 'rounded-lg',
    props.variant === 'text' && 'rounded-md h-3.5',
    props.variant === 'circle' && 'rounded-full',
    props.class,
  ),
);
</script>

<template>
  <div :class="classes" />
</template>
