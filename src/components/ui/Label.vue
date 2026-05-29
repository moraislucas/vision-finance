<script setup lang="ts">
/**
 * Label — ESTILO.MD §10/§3.
 * Texto miúdo em uppercase com tracking — padrão de "label de campo".
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{ class?: string }>();
const classes = computed(() =>
  cn(
    'text-xs font-medium text-muted-foreground tracking-wide uppercase',
    props.class,
  ),
);
</script>

<template>
  <label :class="classes"><slot /></label>
</template>
