<script setup lang="ts">
/**
 * AppLayout — ESTILO.MD §11.
 * Sidebar fixa (desktop, com collapse) + TopBar sticky + BottomNav (mobile) + main.
 * Offset do conteúdo segue o estado do sidebar (lg:pl-20 / lg:pl-64).
 */
import { onMounted, onUnmounted, watch } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDataStore } from '@/stores/data';
import { useSidebar } from '@/composables/useSidebar';
import Sidebar from '@/components/layout/Sidebar.vue';
import TopBar from '@/components/layout/TopBar.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import AppToasts from '@/components/layout/AppToasts.vue';

const auth = useAuthStore();
const data = useDataStore();
const router = useRouter();
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

/**
 * Refresh oportunista para capturar escritas externas (atalho do iPhone, o outro
 * usuário da household) sem refresh manual. O store faz throttle e mantém os dados
 * na tela durante o refetch — então é silencioso, sem flicker. Erros são ignorados
 * de propósito (já refletidos em data.lastError).
 */
function refreshOnActivity(): void {
  if (!auth.householdId || !data.loaded) return;
  void data.refresh().catch(() => {});
}

function onVisibility(): void {
  if (document.visibilityState === 'visible') refreshOnActivity();
}

let stopAfterEach: (() => void) | null = null;

onMounted(() => {
  void ensureLoaded();
  // afterEach só dispara em navegações posteriores (a inicial é coberta por ensureLoaded).
  stopAfterEach = router.afterEach(() => refreshOnActivity());
  window.addEventListener('focus', refreshOnActivity);
  document.addEventListener('visibilitychange', onVisibility);
});

onUnmounted(() => {
  stopAfterEach?.();
  window.removeEventListener('focus', refreshOnActivity);
  document.removeEventListener('visibilitychange', onVisibility);
});

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
        class="px-4 md:px-6 lg:px-8 pt-4 pb-6 md:py-8 max-w-7xl mx-auto"
        style="padding-bottom: calc(5rem + env(safe-area-inset-bottom))"
      >
        <RouterView />
      </main>
    </div>
    <BottomNav />
    <AppToasts />
  </div>
</template>
