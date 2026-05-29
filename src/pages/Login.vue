<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { ArrowRight, Mail, Lock, AlertCircle } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

/** Traduz mensagens cruas do Supabase Auth em texto humano em pt-BR. */
function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('network') || m.includes('failed to fetch'))
    return 'Sem conexão. Verifique sua internet.';
  if (m.includes('rate limit'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  return msg;
}

async function onSubmit() {
  if (submitting.value) return;
  error.value = null;
  submitting.value = true;
  try {
    await auth.signIn(email.value.trim(), password.value);
    const redirect = (route.query.redirect as string | undefined) ?? '/';
    await router.replace(redirect);
  } catch (err) {
    error.value = friendly(err instanceof Error ? err.message : 'Erro ao entrar');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <!-- Layout/centralização vêm do AuthLayout (flex items-center justify-center +
       min-w-[500px] no md+). Aqui só o espaçamento vertical interno. -->
  <div class="space-y-8 animate-fade-in-up max-w-md mx-auto mt-20 py-12">
    <!-- Cabeçalho: badge beta + título + subtítulo -->
    <div class="text-center space-y-2">
      <div
        class="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground"
      >
        <span>💰 Versão Beta</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
        Bem-vindo de volta
      </h1>
      <p class="text-sm text-muted-foreground text-pretty">
        Entre para acompanhar seus gastos, metas e <br />
        quanto você pode gastar todo dia.
      </p>
    </div>

    <!-- Card do formulário -->
    <div class="surface p-6 md:p-7 shadow-elevated space-y-5">
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-2">
          <Label for="email">E-mail</Label>
          <div class="relative">
            <Mail
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="voce@exemplo.com"
              autocomplete="email"
              class="pl-10"
              required
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="password">Senha</Label>
          <div class="relative">
            <Lock
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="pl-10"
              required
            />
          </div>
        </div>

        <div
          v-if="error"
          class="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-fade-in"
          role="alert"
        >
          <AlertCircle class="size-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <Button type="submit" size="lg" class="w-full" :loading="submitting">
          <span>Entrar</span>
          <ArrowRight />
        </Button>

        <RouterLink
          :to="{ name: 'recover' }"
          class="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Esqueci minha senha
        </RouterLink>
      </form>
    </div>
  </div>
</template>
