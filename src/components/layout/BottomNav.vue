<script setup lang="ts">
/**
 * BottomNav (mobile, <lg) — 4 RouterLinks principais + 1 botão "Mais".
 *
 * O botão "Mais" abre `MoreMenuSheet` com TODOS os itens da navigation.ts.
 * Fica destacado como ativo quando a rota atual não está entre os 4
 * principais (ex.: entrou em Contas/Cartões/Categorias via menu).
 */
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { MoreHorizontal } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { navItems } from './navigation';
import MoreMenuSheet from './MoreMenuSheet.vue';

const route = useRoute();

/** Os 4 itens marcados como `mobile: true`. */
const primary = computed(() => navItems.filter((n) => n.mobile).slice(0, 4));

const isMoreActive = computed(() => {
  const names = primary.value.map((i) => i.to.name);
  return !names.includes(route.name as string);
});

const moreOpen = ref(false);
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl safe-area-bottom"
    aria-label="Navegação principal"
  >
    <ul class="grid grid-cols-5">
      <li v-for="item in primary" :key="item.to.name">
        <RouterLink
          :to="item.to"
          :class="
            cn(
              'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
              route.name === item.to.name
                ? 'text-foreground'
                : 'text-muted-foreground/70 hover:text-foreground',
            )
          "
        >
          <span
            v-if="route.name === item.to.name"
            class="absolute inset-x-3 -top-px h-0.5 rounded-full bg-foreground"
            aria-hidden="true"
          />
          <component
            :is="item.icon"
            :class="
              cn(
                'transition-transform',
                route.name === item.to.name ? 'size-[1.35rem] stroke-[2.4]' : 'size-5',
              )
            "
          />
          {{ item.label }}
        </RouterLink>
      </li>

      <!-- Botão "Mais" — abre sheet com menu completo -->
      <li>
        <button
          type="button"
          :class="
            cn(
              'relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors',
              isMoreActive
                ? 'text-foreground'
                : 'text-muted-foreground/70 hover:text-foreground',
            )
          "
          :aria-pressed="isMoreActive"
          aria-haspopup="dialog"
          @click="moreOpen = true"
        >
          <span
            v-if="isMoreActive"
            class="absolute inset-x-3 -top-px h-0.5 rounded-full bg-foreground"
            aria-hidden="true"
          />
          <MoreHorizontal
            :class="
              cn(
                'transition-transform',
                isMoreActive ? 'size-[1.35rem] stroke-[2.4]' : 'size-5',
              )
            "
          />
          Mais
        </button>
      </li>
    </ul>

    <MoreMenuSheet v-model:open="moreOpen" />
  </nav>
</template>
