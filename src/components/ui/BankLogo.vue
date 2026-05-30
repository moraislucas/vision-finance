<script setup lang="ts">
/**
 * BankLogo — renderiza o logo de um banco a partir do slug guardado em
 * `account.icon` / `card.icon`. Se o slug não for um banco conhecido, cai num
 * fallback elegante: tile com a cor da conta/cartão + monograma (1ª letra).
 *
 * Marcas vivem em `src/lib/constants/banks.ts` (auto-extensível).
 */
import { computed } from 'vue';
import { resolveBank } from '@/lib/constants/banks';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    slug?: string | null;
    name: string;
    color?: string | null;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { slug: null, color: null, size: 'md' },
);

const bank = computed(() => resolveBank(props.slug));

const tileClass = computed(
  () =>
    ({
      sm: 'size-7 rounded-lg',
      md: 'size-9 rounded-xl',
      lg: 'size-11 rounded-2xl',
    })[props.size],
);

const monogramClass = computed(
  () =>
    ({
      sm: 'text-[11px]',
      md: 'text-sm',
      lg: 'text-base',
    })[props.size],
);

const fallbackColor = computed(() => props.color ?? '#0A84FF');
const monogram = computed(() => props.name.trim().charAt(0).toUpperCase() || '?');
</script>

<template>
  <!-- Marca conhecida: tile neutro com a logo da marca -->
  <span
    v-if="bank"
    :class="cn('grid shrink-0 place-items-center bg-secondary ring-1 ring-border/60', tileClass)"
  >
    <img
      :src="bank.logo"
      :alt="bank.label"
      class="size-[68%] object-contain"
      loading="lazy"
      decoding="async"
    />
  </span>

  <!-- Fallback: monograma na cor da conta/cartão -->
  <span
    v-else
    :class="cn('grid shrink-0 place-items-center font-semibold tabular-nums', tileClass, monogramClass)"
    :style="{ backgroundColor: `${fallbackColor}1f`, color: fallbackColor }"
  >
    {{ monogram }}
  </span>
</template>
