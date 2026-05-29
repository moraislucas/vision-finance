<script setup lang="ts">
/**
 * Badge — ESTILO.MD §10. 8 variantes semafóricas + prop `dot` (pontinho colorido).
 *
 * Compatibilidade: aceita também `color` (hex livre) para badges baseadas em
 * categoria — quando passado, sobrepõe a variante e usa a cor diretamente.
 */
import { computed } from 'vue';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-secondary text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        primary: 'border-primary/25 bg-primary/10 text-primary',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/25 bg-warning/10 text-warning',
        danger: 'border-destructive/25 bg-destructive/10 text-destructive',
        info: 'border-info/25 bg-info/10 text-info',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariants['variant'];
    dot?: boolean;
    /** Cor hex livre (categorias). Quando setada, ignora a variante. */
    color?: string | null;
    class?: string;
    /** Legacy: `size` é mantido para compatibilidade, mas o guia padroniza text-2xs. */
    size?: 'sm' | 'md';
  }>(),
  { variant: 'default', dot: false, color: null, size: 'sm' },
);

const classes = computed(() =>
  cn(props.color ? '' : badgeVariants({ variant: props.variant }), props.class),
);

const inlineStyle = computed(() =>
  props.color
    ? {
        backgroundColor: `${props.color}1A`,
        color: props.color,
        borderColor: `${props.color}40`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '9999px',
        padding: '0.125rem 0.625rem',
        fontSize: '0.6875rem',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
      }
    : undefined,
);

const dotColor = computed(() => {
  if (props.color) return props.color;
  switch (props.variant) {
    case 'primary':
      return 'oklch(var(--primary))';
    case 'success':
      return 'oklch(var(--success))';
    case 'warning':
      return 'oklch(var(--warning))';
    case 'danger':
      return 'oklch(var(--destructive))';
    case 'info':
      return 'oklch(var(--info))';
    default:
      return 'oklch(var(--muted-foreground))';
  }
});
</script>

<template>
  <span :class="classes" :style="inlineStyle">
    <span
      v-if="dot"
      class="size-1.5 rounded-full"
      :style="{ backgroundColor: dotColor }"
    />
    <slot />
  </span>
</template>
