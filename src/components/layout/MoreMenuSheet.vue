<script setup lang="ts">
/**
 * Sheet acionada pelo botão "Mais" da BottomNav no mobile.
 *
 * Lista TODOS os itens da navegação agrupados por seção. Item clicado fecha
 * o sheet e navega via Vue Router. Usado só no mobile (<lg).
 */
import { RouterLink, useRoute } from 'vue-router';
import Sheet from '@/components/ui/Sheet.vue';
import { navItems, sectionTitles, type NavItem } from './navigation';
import { computed } from 'vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const route = useRoute();
const isActive = (item: NavItem) => route.name === item.to.name;

/** Agrupa por section pra renderizar com header de seção. */
const grouped = computed(() => {
  const buckets: Record<NonNullable<NavItem['section']>, NavItem[]> = {
    main: [],
    control: [],
    strategy: [],
    settings: [],
  };
  for (const item of navItems) {
    if (!item.section) continue;
    buckets[item.section].push(item);
  }
  return buckets;
});

function close() {
  emit('update:open', false);
}
</script>

<template>
  <Sheet :open="open" title="Navegação" size="md" @update:open="(v) => $emit('update:open', v)">
    <nav class="space-y-5" aria-label="Menu completo">
      <section
        v-for="key in ['main', 'control', 'strategy', 'settings'] as const"
        :key="key"
      >
        <h3
          class="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          {{ sectionTitles[key] }}
        </h3>
        <ul class="space-y-1">
          <li v-for="item in grouped[key]" :key="item.to.name">
            <RouterLink
              :to="item.to"
              :class="
                [
                  'flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors active:scale-[0.99]',
                  isActive(item)
                    ? 'border-border bg-secondary text-foreground shadow-soft'
                    : 'border-transparent text-foreground hover:bg-secondary/60',
                ]
              "
              @click="close"
            >
              <span
                :class="[
                  'grid size-9 place-items-center rounded-xl',
                  isActive(item) ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                ]"
              >
                <component :is="item.icon" class="size-4" />
              </span>
              <span class="font-medium">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </nav>
  </Sheet>
</template>
