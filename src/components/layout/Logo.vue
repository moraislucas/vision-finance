<script setup lang="ts">
/**
 * Marca textual + ícone (mesma identidade do favicon).
 * Quando `collapsed` no Sidebar, esconde o texto.
 */
withDefaults(defineProps<{ collapsed?: boolean }>(), { collapsed: false });
</script>

<template>
  <div class="flex items-center gap-2.5">
    <!-- Ícone — chart-line ascendente, espelho do favicon.svg -->
    <div
      class="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-primary-glow ring-1 ring-white/10"
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" fill="none" class="size-5">
        <path
          d="M6 22 L11.5 14.5 L16 18 L22.5 9.5"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.95"
        />
        <circle cx="22.5" cy="9.5" r="2" fill="currentColor" />
        <circle cx="11.5" cy="14.5" r="1.1" fill="currentColor" opacity="0.7" />
        <circle cx="16" cy="18" r="1.1" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
    <div v-if="!collapsed" class="leading-tight">
      <div
        class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
      >
        Vision
      </div>
      <div class="text-base font-semibold tracking-tight">Finance</div>
    </div>
  </div>
</template>
