<script setup lang="ts">
import { formatCurrency } from '@/lib/helpers/format';
import type { FunctionalComponent, SVGAttributes } from 'vue';
import Card from '@/components/ui/Card.vue';

defineProps<{
  label: string;
  value: number;
  hint?: string;
  icon?: FunctionalComponent<SVGAttributes>;
  tone?: 'neutral' | 'positive' | 'negative' | 'muted';
}>();

const toneClass: Record<string, string> = {
  neutral: 'text-foreground',
  positive: 'text-success',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};
</script>

<template>
  <Card class="relative p-4 md:p-5">
    <div class="flex items-start justify-between gap-2">
      <div class="space-y-1 flex-1 min-w-0">
        <p
          class="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          :title="label"
        >
          {{ label }}
        </p>
        <p
          :class="[
            'tabular-nums font-semibold tracking-tight',
            'text-lg md:text-2xl',
            toneClass[tone ?? 'neutral'],
          ]"
        >
          {{ formatCurrency(value) }}
        </p>
      </div>
      <div
        v-if="icon"
        class="grid place-items-center size-7 md:size-8 rounded-lg md:rounded-xl bg-secondary border border-border/60 shrink-0 text-muted-foreground"
      >
        <component :is="icon" class="size-3.5" />
      </div>
    </div>
    <p v-if="hint" class="mt-2 text-[11px] text-muted-foreground line-clamp-2">
      {{ hint }}
    </p>
  </Card>
</template>
