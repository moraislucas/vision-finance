<script setup lang="ts">
/**
 * TopBar — ESTILO.MD §11. Sticky com glass; Logo (mobile), título da rota
 * (desktop), ações à direita (logout). Altura h-14 / h-16.
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogOut } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { navItems } from './navigation';
import Button from '@/components/ui/Button.vue';
import Logo from './Logo.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const pageTitle = computed(() => {
  const hit = navItems.find((n) => n.to.name === route.name);
  return hit?.label ?? '';
});

async function onLogout() {
  await auth.signOut();
  toast.info('Você saiu.');
  await router.push({ name: 'login' });
}
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b border-border glass safe-area-top"
  >
    <div class="flex h-14 lg:h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
      <div class="lg:hidden">
        <Logo />
      </div>
      <h1 class="hidden lg:block text-sm font-medium text-muted-foreground">
        {{ pageTitle }}
      </h1>
      <div class="ml-auto flex items-center gap-2">
        <span class="hidden md:inline-flex text-xs text-muted-foreground">
          {{ auth.profile?.name ?? '' }}
        </span>
        <Button variant="ghost" size="icon-sm" :aria-label="'Sair'" @click="onLogout">
          <LogOut />
        </Button>
      </div>
    </div>
  </header>
</template>
