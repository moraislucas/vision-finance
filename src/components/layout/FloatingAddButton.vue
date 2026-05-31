<script setup lang="ts">
import { Plus } from '@lucide/vue';

defineProps<{ label?: string; class?: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    :class="
      [
        'fixed bottom-[calc(5rem_+_env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-primary-glow transition-all duration-200 ease-smooth hover:bg-primary/90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:bottom-6 lg:right-6',
        $props.class,
      ].filter(Boolean)
    "
    :aria-label="label ?? 'Nova transação'"
    @click="$emit('click')"
  >
    <Plus class="size-6" />
  </button>
</template>
