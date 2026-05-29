<script setup lang="ts">
/**
 * PageHeader — ESTILO.MD §11. Eyebrow + título + descrição + slot `actions`.
 */
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <header class="flex flex-col gap-1.5 mb-6 md:mb-8">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p
          v-if="eyebrow"
          class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          {{ eyebrow }}
        </p>
        <h1 class="text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          {{ title }}
        </h1>
        <p v-if="description" class="text-sm text-muted-foreground text-pretty">
          {{ description }}
        </p>
      </div>
      <div class="shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
