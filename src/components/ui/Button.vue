<script setup lang="ts">
/**
 * Button — ESTILO.MD §10 (anatomia + variantes).
 *
 * Alias de retrocompatibilidade: `variant="primary"` mapeia para `default`
 * e `size="md"` mapeia para `default` — evita churn nas páginas existentes.
 */
import { computed } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-primary-glow',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 text-sm rounded-xl [&_svg]:size-4',
        sm: 'h-8 px-3 text-xs rounded-lg [&_svg]:size-3.5',
        lg: 'h-12 px-6 text-base rounded-2xl [&_svg]:size-5',
        xl: 'h-14 px-7 text-base rounded-2xl [&_svg]:size-5',
        icon: 'size-10 rounded-xl [&_svg]:size-4',
        'icon-sm': 'size-8 rounded-lg [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;
// Aceita "primary" (alias) e "md" (alias) para manter compatibilidade.
type LegacyVariant = ButtonVariants['variant'] | 'primary';
type LegacySize = ButtonVariants['size'] | 'md';

const props = withDefaults(
  defineProps<{
    variant?: LegacyVariant;
    size?: LegacySize;
    as?: 'button' | 'a';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    class?: string;
  }>(),
  {
    variant: 'default',
    size: 'default',
    as: 'button',
    type: 'button',
    disabled: false,
    loading: false,
  },
);

const resolvedVariant = computed<ButtonVariants['variant']>(() =>
  props.variant === 'primary' ? 'default' : (props.variant ?? 'default'),
);
const resolvedSize = computed<ButtonVariants['size']>(() =>
  props.size === 'md' ? 'default' : (props.size ?? 'default'),
);

const classes = computed(() =>
  cn(
    buttonVariants({ variant: resolvedVariant.value, size: resolvedSize.value }),
    props.class,
  ),
);
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :class="classes"
    :aria-busy="loading || undefined"
  >
    <span
      v-if="loading"
      class="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
