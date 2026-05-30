<script setup lang="ts">
/**
 * PageHeader — ESTILO.MD §11. Eyebrow + título + descrição + slot `actions`.
 *
 * Mobile (<md): título 22px, descrição limitada a 2 linhas, actions abaixo
 * (stacked) para não competir por espaço lateral.
 * Desktop: layout horizontal título | actions.
 */
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <header class="mb-5 md:mb-8">
    <div class="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0 flex-1">
        <p
          v-if="eyebrow"
          class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          {{ eyebrow }}
        </p>
        <h1 class="text-[22px] md:text-3xl font-semibold tracking-tight text-balance leading-tight">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-1 text-[13px] md:text-sm text-muted-foreground text-pretty"
        >
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="shrink-0 self-stretch md:self-auto">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
