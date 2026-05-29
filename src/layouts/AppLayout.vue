<script setup lang="ts">
/**
 * AppLayout — ESTILO.MD §11.
 * Sidebar fixa (desktop, com collapse) + TopBar sticky + BottomNav (mobile) + main.
 * Offset do conteúdo segue o estado do sidebar (lg:pl-20 / lg:pl-64).
 */
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDataStore } from '@/stores/data';
import { useSidebar } from '@/composables/useSidebar';
import Sidebar from '@/components/layout/Sidebar.vue';
import TopBar from '@/components/layout/TopBar.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import AppToasts from '@/components/layout/AppToasts.vue';

const auth = useAuthStore();
const data = useDataStore();
const { collapsed } = useSidebar();

async function ensureLoaded(): Promise<void> {
  if (!data.loaded && auth.householdId) {
    try {
      await data.loadAll();
    } catch {
      /* erro tratado no store; UI mostrará via lastError */
    }
  }
}

onMounted(ensureLoaded);
watch(() => auth.householdId, ensureLoaded);
</script>

<template>
  <div class="min-h-svh bg-background text-foreground overflow-x-hidden">
    <Sidebar />
    <div
      :class="[
        'transition-[padding] duration-300 ease-smooth',
        collapsed ? 'lg:pl-20' : 'lg:pl-64',
      ]"
    >
      <TopBar />
      <main
        class="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl mx-auto"
        style="padding-bottom: 96px"
      >
        <RouterView />
      </main>
    </div>
    <BottomNav />
    <AppToasts />
  </div>
</template>
