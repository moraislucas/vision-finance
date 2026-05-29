<script setup lang="ts">
/**
 * BottomNav (mobile, <lg) — ESTILO.MD §11. Grid 5-col, glass, indicador tipo
 * "barra superior" no ativo. Itens vêm da `navigation.ts` filtrando `mobile`.
 */
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { cn } from '@/lib/utils';
import { navItems } from './navigation';

const route = useRoute();
const items = computed(() => navItems.filter((n) => n.mobile).slice(0, 5));
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl safe-area-bottom"
    aria-label="Navegação principal"
  >
    <ul class="grid grid-cols-5">
      <li v-for="item in items" :key="item.to.name">
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
    </ul>
  </nav>
</template>
