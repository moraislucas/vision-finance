<script setup lang="ts">
/**
 * Card — ESTILO.MD §10. Aceita `interactive` / `elevated` / `padded`.
 * `padded` default false para retrocompatibilidade — várias páginas atuais
 * já passam classes de padding por fora; ative quando quiser o p-5 md:p-6 do guia.
 */
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    interactive?: boolean;
    elevated?: boolean;
    padded?: boolean;
    as?: keyof HTMLElementTagNameMap;
    class?: string;
  }>(),
  { interactive: false, elevated: false, padded: false, as: 'div' },
);

const classes = computed(() =>
  cn(
    'rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 ease-smooth',
    props.padded && 'p-5 md:p-6',
    props.elevated && 'shadow-elevated',
    props.interactive &&
      'hover:border-border/80 hover:bg-card/80 cursor-pointer active:scale-[0.995]',
    props.class,
  ),
);
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
