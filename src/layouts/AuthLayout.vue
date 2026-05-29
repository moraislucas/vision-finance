<script setup lang="ts">
/**
 * AuthLayout — fundo decorativo + form centralizado via flex
 * (display: flex; align-items: center; justify-content: center).
 *
 * Form recebe `min-w-[500px]` no desktop (md+) e full-width no mobile.
 */
import { RouterView } from 'vue-router';
</script>

<template>
  <div
    class="relative flex min-h-svh items-center justify-center bg-background text-foreground px-4 py-6 overflow-hidden"
  >
    <!-- Fundo decorativo (pointer-events-none para não bloquear cliques) -->
    <div
      class="pointer-events-none absolute inset-0 grid-pattern opacity-[0.08]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-foreground/[0.04] blur-3xl"
      style="
        mask-image: radial-gradient(circle at 50% 50%, black 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(circle at 50% 50%, black 0%, transparent 70%);
      "
      aria-hidden="true"
    />

    <!-- Container do form: full-width no mobile, min-w-[500px] no md+. -->
    <div class="relative z-10 w-full md:w-auto md:min-w-[500px]">
      <RouterView />
    </div>

    <!-- Footer não disputa espaço com o conteúdo. -->
    <footer
      class="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-muted-foreground/70"
    >
      © {{ new Date().getFullYear() }} · Vision Finance
    </footer>
  </div>
</template>
