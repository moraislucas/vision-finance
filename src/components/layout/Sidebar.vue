<script setup lang="ts">
/**
 * Sidebar (desktop, ≥lg) — ESTILO.MD §11. Fixed, glass, animação de largura
 * w-20 ↔ w-64. Item ativo: bg-secondary + border + shadow-soft.
 */
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { navItems, sectionTitles, type NavItem } from './navigation';
import { useSidebar } from '@/composables/useSidebar';
import { useAuthStore } from '@/stores/auth';
import Logo from './Logo.vue';
import StatusDot from '@/components/ui/StatusDot.vue';

const route = useRoute();
const { collapsed, toggle } = useSidebar();
const auth = useAuthStore();

const desktopItems = computed(() => navItems.filter((n) => n.desktop));

const grouped = computed(() => {
  const buckets: Record<NonNullable<NavItem['section']>, NavItem[]> = {
    main: [],
    control: [],
    strategy: [],
    settings: [],
  };
  for (const it of desktopItems.value) {
    if (!it.section) continue;
    buckets[it.section].push(it);
  }
  return buckets;
});

const initials = computed(() => {
  const n = auth.profile?.name ?? '';
  return (
    n
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?'
  );
});
</script>

<template>
  <aside
    :class="[
      'hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-300 ease-smooth',
      collapsed ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Header / Logo -->
    <div
      :class="[
        'flex items-center h-16 border-b border-border px-4',
        collapsed ? 'justify-center' : 'justify-between',
      ]"
    >
      <Logo :collapsed="collapsed" />
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegação lateral">
      <div
        v-for="key in ['main', 'control', 'strategy', 'settings'] as const"
        :key="key"
        class="mb-5 last:mb-0"
      >
        <p
          v-if="!collapsed"
          class="px-2.5 mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
        >
          {{ sectionTitles[key] }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in grouped[key]" :key="item.to.name">
            <RouterLink
              :to="item.to"
              :class="
                cn(
                  'group flex items-center gap-3 rounded-xl border border-transparent px-3 h-10 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  route.name === item.to.name
                    ? 'bg-secondary text-foreground border-border shadow-soft'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )
              "
            >
              <component :is="item.icon" class="size-4 shrink-0" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer / Usuário -->
    <div
      :class="[
        'border-t border-border p-3 flex items-center gap-3',
        collapsed ? 'justify-center' : '',
      ]"
    >
      <div
        class="grid size-9 place-items-center rounded-xl bg-secondary border border-border text-xs font-semibold"
      >
        {{ initials }}
      </div>
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <p class="text-sm font-medium truncate">{{ auth.profile?.name ?? '—' }}</p>
        <p class="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <StatusDot tone="success" :pulse="true" size="sm" />
          Online
        </p>
      </div>
      <button
        type="button"
        :aria-label="collapsed ? 'Expandir sidebar' : 'Recolher sidebar'"
        class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        @click="toggle"
      >
        <component :is="collapsed ? ChevronRight : ChevronLeft" class="size-4" />
      </button>
    </div>
  </aside>
</template>
