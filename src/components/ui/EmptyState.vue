<script setup lang="ts">
/**
 * EmptyState — bloco neutro de "lista vazia" com destaque.
 * Renderiza como um Card com fundo neutro, borda discreta, ícone centralizado
 * e área de ação opcional via slot.
 */
import { Inbox } from '@lucide/vue';
import type { FunctionalComponent, SVGAttributes } from 'vue';
defineProps<{
  title: string;
  description?: string;
  icon?: FunctionalComponent<SVGAttributes>;
}>();
</script>

<template>
  <div
    class="grid place-items-center rounded-2xl border border-border bg-card px-6 py-12 text-center"
  >
    <div class="max-w-sm">
      <div
        class="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground"
      >
        <component :is="icon ?? Inbox" class="size-5" />
      </div>
      <p class="text-base font-semibold text-foreground">{{ title }}</p>
      <p
        v-if="description"
        class="mt-1.5 text-sm text-muted-foreground text-pretty"
      >
        {{ description }}
      </p>
      <div v-if="$slots.default" class="mt-5 flex justify-center">
        <slot />
      </div>
    </div>
  </div>
</template>
