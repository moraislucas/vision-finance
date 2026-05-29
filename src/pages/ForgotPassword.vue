<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Logo from '@/components/layout/Logo.vue';

const auth = useAuthStore();
const email = ref('');
const submitting = ref(false);
const sent = ref(false);
const errorMsg = ref<string | null>(null);

async function onSubmit() {
  errorMsg.value = null;
  submitting.value = true;
  try {
    await auth.recoverPassword(email.value);
    sent.value = true;
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : 'Erro ao enviar email de recuperação';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Card padded elevated class="space-y-6">
    <div class="flex items-center justify-center">
      <Logo />
    </div>

    <div class="space-y-1 text-center">
      <h1 class="text-xl font-semibold tracking-tight">Recuperar senha</h1>
      <p class="text-sm text-muted-foreground">
        Enviaremos um link para redefinir seu acesso.
      </p>
    </div>

    <form v-if="!sent" class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-1.5">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
        />
      </div>

      <p v-if="errorMsg" class="text-sm text-destructive">{{ errorMsg }}</p>

      <Button type="submit" size="lg" :loading="submitting" class="w-full">
        Enviar link
      </Button>
    </form>

    <p
      v-else
      class="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
    >
      Link enviado. Verifique sua caixa de entrada.
    </p>

    <RouterLink
      :to="{ name: 'login' }"
      class="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Voltar ao login
    </RouterLink>
  </Card>
</template>
