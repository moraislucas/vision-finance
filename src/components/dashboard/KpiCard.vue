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
  <Card padded class="relative">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 flex-1 min-w-0">
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">
          {{ label }}
        </p>
        <p
          :class="[
            'tabular-nums text-xl md:text-2xl font-semibold tracking-tight',
            toneClass[tone ?? 'neutral'],
          ]"
        >
          {{ formatCurrency(value) }}
        </p>
      </div>
      <div
        v-if="icon"
        class="grid place-items-center size-8 rounded-xl bg-secondary border border-border/60 shrink-0 text-muted-foreground"
      >
        <component :is="icon" class="size-3.5" />
      </div>
    </div>
    <p v-if="hint" class="mt-3 text-[11px] text-muted-foreground">{{ hint }}</p>
  </Card>
</template>
