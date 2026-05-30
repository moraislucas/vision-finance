<script setup lang="ts">
/**
 * Cartão "Atalho rápido (iPhone)" das Configurações.
 *
 * Permite ao usuário:
 *  - gerar/regenerar/limpar o quick_token do seu profile;
 *  - escolher a conta default usada por lançamentos via atalho;
 *  - copiar a URL do endpoint;
 *  - ver as instruções passo-a-passo de como criar o atalho no Shortcuts.
 *
 * Token é exibido mascarado por padrão (botão olho pra revelar).
 */
import { computed, ref } from 'vue';
import {
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  RotateCw,
  Trash2,
  Check,
  Info,
  AlertTriangle,
} from '@lucide/vue';
import { useAuthStore } from '@/stores/auth';
import { useDataStore } from '@/stores/data';
import { useSettingsStore } from '@/stores/settings';
import { useToast } from '@/composables/useToast';

import Card from '@/components/ui/Card.vue';
import Label from '@/components/ui/Label.vue';
import Button from '@/components/ui/Button.vue';
import Select from '@/components/ui/Select.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import IconButton from '@/components/ui/IconButton.vue';

const auth = useAuthStore();
const data = useDataStore();
const settings = useSettingsStore();
const toast = useToast();

const tokenVisible = ref(false);
const generating = ref(false);
const clearOpen = ref(false);

const token = computed(() => auth.profile?.quick_token ?? null);
const masked = computed(() => (token.value ? '••••••••-••••-••••-••••-••••••••••••' : 'nenhum'));

const endpoint = computed(() => {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? '';
  return url ? `${url}/functions/v1/quick-transaction` : '/functions/v1/quick-transaction';
});

const accountOptions = computed(() => [
  { value: '', label: 'Nenhuma (lançamento sem conta)' },
  ...data.accounts.map((a) => ({ value: a.id, label: a.name })),
]);

const defaultAccountId = ref<string>(data.settings?.default_account_id ?? '');

// Mantém sync com a store quando ela atualiza.
import { watch } from 'vue';
watch(
  () => data.settings?.default_account_id,
  (v) => {
    defaultAccountId.value = v ?? '';
  },
);

async function copy(text: string, label = 'Copiado!') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error('Não foi possível copiar. Selecione e copie manualmente.');
  }
}

async function generate() {
  generating.value = true;
  try {
    const newToken = await auth.regenerateQuickToken();
    tokenVisible.value = true;
    await copy(newToken, 'Token gerado e copiado!');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao gerar token.');
  } finally {
    generating.value = false;
  }
}

async function clear() {
  try {
    await auth.clearQuickToken();
    toast.info('Atalho desativado.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao limpar.');
  }
}

async function saveDefaultAccount() {
  try {
    await settings.update({ default_account_id: defaultAccountId.value || null });
    toast.success('Conta padrão salva.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}

const instructions = [
  { step: 1, text: 'Abra o app "Atalhos" no iPhone → toque em "+" para criar um novo atalho.' },
  { step: 2, text: 'Adicione "Escolher do Menu" e crie uma opção para cada categoria (Mercado, Alimentação, Transporte, Lazer, Outros…).' },
  { step: 3, text: 'DENTRO de cada opção do menu, adicione duas ações: "Texto" com o nome da categoria (ex.: Mercado) e logo abaixo "Definir variável" chamada categoria apontando para esse Texto. É isso que faz o app saber qual categoria você tocou — sem esse passo a categoria chega vazia.' },
  { step: 4, text: 'Adicione "Pedir Número" para o valor.' },
  { step: 5, text: '(Opcional) "Pedir Texto" para a descrição.' },
  { step: 6, text: 'Adicione "Obter Conteúdo da URL": método POST; Cabeçalho Content-Type = application/json; Corpo da Solicitação = JSON.' },
  { step: 7, text: 'No corpo JSON, crie 4 campos SEPARADOS na raiz: token (seu token), type (expense), amount (a variável do valor) e category (a variável categoria). Não embrulhe tudo num único campo "body".' },
  { step: 8, text: 'Adicione "Obter Valor do Dicionário" (chave summary) a partir do Conteúdo da URL e depois "Mostrar Notificação" com esse valor.' },
  { step: 9, text: 'Em Ajustes → Acessibilidade → Toque → Toque Atrás → Toque Duplo, selecione este atalho.' },
];
</script>

<template>
  <Card padded>
    <header class="mb-4 flex items-start gap-3">
      <div class="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
        <Smartphone class="size-4" />
      </div>
      <div class="min-w-0">
        <Label>Atalho rápido (iPhone)</Label>
        <p class="mt-1 text-sm text-muted-foreground">
          Lance uma despesa em 2-5 segundos via Back Tap (toque duplo na traseira do
          iPhone) usando o app Atalhos.
        </p>
      </div>
    </header>

    <!-- Token -->
    <div class="space-y-2">
      <Label for="quick_token">Seu token pessoal</Label>
      <div
        class="flex items-center gap-2 rounded-xl border border-input bg-secondary/40 px-3 py-2"
      >
        <code
          id="quick_token"
          class="flex-1 truncate text-xs tabular-nums"
          :class="!token && 'text-muted-foreground'"
        >
          {{ token ? (tokenVisible ? token : masked) : 'Nenhum — gere abaixo' }}
        </code>
        <IconButton
          v-if="token"
          :label="tokenVisible ? 'Ocultar' : 'Mostrar'"
          @click="tokenVisible = !tokenVisible"
        >
          <component :is="tokenVisible ? EyeOff : Eye" />
        </IconButton>
        <IconButton
          v-if="token"
          label="Copiar token"
          @click="copy(token!, 'Token copiado!')"
        >
          <Copy />
        </IconButton>
      </div>
      <p class="text-xs text-muted-foreground">
        Identifica VOCÊ (não sua parceira) nos lançamentos via atalho. Se vazar, regenere.
      </p>
      <div class="flex flex-wrap gap-2">
        <Button
          size="sm"
          :loading="generating"
          @click="generate"
        >
          <RotateCw />
          {{ token ? 'Gerar novo token' : 'Gerar token' }}
        </Button>
        <Button
          v-if="token"
          size="sm"
          variant="ghost"
          @click="clearOpen = true"
        >
          <Trash2 />
          Desativar atalho
        </Button>
      </div>
    </div>

    <!-- Endpoint -->
    <div class="mt-5 space-y-2">
      <Label>URL do endpoint</Label>
      <div
        class="flex items-center gap-2 rounded-xl border border-input bg-secondary/40 px-3 py-2"
      >
        <code class="flex-1 truncate text-xs">{{ endpoint }}</code>
        <IconButton label="Copiar URL" @click="copy(endpoint, 'URL copiada!')">
          <Copy />
        </IconButton>
      </div>
    </div>

    <!-- Conta padrão -->
    <div class="mt-5 space-y-2">
      <Label for="default_account">Conta padrão do atalho</Label>
      <div class="flex gap-2">
        <div class="flex-1">
          <Select
            id="default_account"
            v-model="defaultAccountId"
            :options="accountOptions"
          />
        </div>
        <Button size="md" :loading="settings.saving" @click="saveDefaultAccount">
          Salvar
        </Button>
      </div>
      <p class="text-xs text-muted-foreground">
        Para o atalho não perguntar a conta a cada vez. Sem isso, a transação fica
        sem conta vinculada (B0 não desconta).
      </p>
    </div>

    <!-- Instruções de montagem -->
    <details class="mt-5 rounded-xl border border-border bg-secondary/20">
      <summary class="cursor-pointer list-none px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <span class="flex items-center gap-2 text-sm font-medium">
            <Info class="size-4 text-muted-foreground" />
            Como criar o atalho no iPhone
          </span>
          <span class="text-xs text-muted-foreground">expandir ↓</span>
        </div>
      </summary>
      <div class="space-y-4 border-t border-border px-4 py-4">
        <ol class="space-y-2.5 text-sm">
          <li
            v-for="i in instructions"
            :key="i.step"
            class="flex gap-3"
          >
            <span
              class="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary tabular-nums"
            >
              {{ i.step }}
            </span>
            <span class="leading-snug text-foreground/90">{{ i.text }}</span>
          </li>
        </ol>

        <div
          class="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning"
        >
          <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
          <span>
            Duas pegadinhas que travam o atalho: (1) o "Escolher do Menu" não guarda
            a escolha sozinho — use o "Definir variável" do passo 3; (2) no corpo,
            adicione os 4 campos na raiz, <strong>não</strong> dentro de um campo
            <code class="rounded bg-warning/15 px-1">body</code>.
          </span>
        </div>

        <div class="space-y-2">
          <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">
            Body JSON do POST (cada chave = um campo separado)
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-border bg-card p-3 text-[11px] leading-relaxed"
          ><code>{
  "token": "&lt;seu token&gt;",
  "type": "expense",
  "amount": &lt;valor do passo 3&gt;,
  "category": "&lt;categoria do passo 4&gt;",
  "description": "&lt;texto do passo 5&gt;"
}</code></pre>
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              @click="
                copy(
                  JSON.stringify(
                    {
                      token: '&lt;seu token&gt;',
                      type: 'expense',
                      amount: 0,
                      category: 'Mercado',
                      description: '',
                    },
                    null,
                    2,
                  ),
                  'Template copiado!',
                )
              "
            >
              <Copy />
              Copiar template
            </Button>
          </div>
        </div>

        <div
          class="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-[12px] text-info"
        >
          <Check class="mt-0.5 size-3.5 shrink-0" />
          <span>
            Ao final, o atalho deve mostrar uma Notificação com o
            <code class="rounded bg-info/15 px-1">summary</code> retornado pela API
            (ex.: <em>"Mercado · -R$ 38,90"</em>).
          </span>
        </div>
      </div>
    </details>

    <ConfirmDialog
      v-model:open="clearOpen"
      title="Desativar atalho?"
      description="Seu token será apagado. Qualquer atalho que estiver usando esse token vai parar de funcionar. Você pode gerar outro depois."
      confirm-text="Desativar"
      destructive
      @confirm="clear"
    />
  </Card>
</template>
