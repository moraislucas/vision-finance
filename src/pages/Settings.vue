<script setup lang="ts">
import { ref, watch } from 'vue';
import { LogOut, PiggyBank } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useToast } from '@/composables/useToast';

import Card from '@/components/ui/Card.vue';
import Label from '@/components/ui/Label.vue';
import Button from '@/components/ui/Button.vue';
import Switch from '@/components/ui/Switch.vue';
import MoneyInput from '@/components/ui/MoneyInput.vue';
import PageHeader from '@/components/ui/PageHeader.vue';

const data = useDataStore();
const auth = useAuthStore();
const settings = useSettingsStore();
const toast = useToast();
const router = useRouter();

const monthlyBudget = ref<number>(data.settings?.monthly_budget ?? 0);
const budgetEnabled = ref<boolean>(data.settings?.budget_enabled ?? true);
const savingsTarget = ref<number>(data.settings?.monthly_savings_target ?? 0);

watch(
  () => data.settings,
  (s) => {
    monthlyBudget.value = s?.monthly_budget ?? 0;
    budgetEnabled.value = s?.budget_enabled ?? true;
    savingsTarget.value = s?.monthly_savings_target ?? 0;
  },
);

async function saveBudget() {
  try {
    await settings.update({
      monthly_budget: monthlyBudget.value > 0 ? monthlyBudget.value : null,
      budget_enabled: budgetEnabled.value,
    });
    toast.success('Teto mensal salvo.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}

async function saveSavings() {
  try {
    await settings.update({
      monthly_savings_target: savingsTarget.value > 0 ? savingsTarget.value : null,
    });
    toast.success('Margem de poupança salva.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
  }
}

async function onLogout() {
  await auth.signOut();
  await router.push({ name: 'login' });
}
</script>

<template>
  <section class="max-w-2xl">
    <PageHeader
      eyebrow="Casa"
      title="Configurações"
      description="Margem de poupança, teto mensal e perfil."
    />

    <div class="space-y-4">
      <!-- Margem de poupança automática -->
      <Card padded>
        <header class="mb-3 flex items-start gap-3">
          <div class="grid size-9 place-items-center rounded-xl bg-success/10 text-success">
            <PiggyBank class="size-4" />
          </div>
          <div>
            <Label>Margem de poupança</Label>
            <p class="text-sm text-muted-foreground mt-1">
              Valor em R$ que SEMPRE deve sobrar no fim do mês, além das suas metas.
              O Pode Gastar diário desconta essa margem automaticamente — assim você
              nunca termina o mês zerado.
            </p>
          </div>
        </header>
        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label for="savings_target">Quanto poupar todo mês</Label>
            <MoneyInput
              id="savings_target"
              v-model="savingsTarget"
              placeholder="R$ 0,00"
            />
            <p class="text-xs text-muted-foreground">
              Deixe vazio (R$ 0,00) para desativar e usar apenas suas metas.
            </p>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <Button :loading="settings.saving" @click="saveSavings">Salvar margem</Button>
        </div>
      </Card>

      <!-- Teto mensal -->
      <Card padded>
        <header class="mb-3">
          <Label>Teto mensal de gastos</Label>
          <p class="text-sm text-muted-foreground mt-1">
            Opcional. Aparece como referência de limite no dashboard. Diferente da
            margem acima: este é o teto que você não quer ultrapassar nos gastos.
          </p>
        </header>
        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label for="monthly_budget">Valor</Label>
            <MoneyInput
              id="monthly_budget"
              v-model="monthlyBudget"
              placeholder="R$ 0,00"
            />
          </div>
          <div
            class="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3"
          >
            <div class="space-y-0.5">
              <p class="text-sm font-medium">Ativado</p>
              <p class="text-xs text-muted-foreground">
                Exibe o teto no dashboard quando ligado.
              </p>
            </div>
            <Switch v-model="budgetEnabled" />
          </div>
        </div>
        <div class="mt-3 flex justify-end">
          <Button :loading="settings.saving" @click="saveBudget">Salvar teto</Button>
        </div>
      </Card>

      <!-- Perfil -->
      <Card padded>
        <header class="mb-3">
          <Label>Perfil</Label>
        </header>
        <dl class="space-y-1.5 text-sm">
          <div class="flex gap-2">
            <dt class="text-muted-foreground w-24">Nome</dt>
            <dd>{{ auth.profile?.name ?? '—' }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted-foreground w-24">Email</dt>
            <dd>{{ auth.profile?.email ?? '—' }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted-foreground w-24">Household</dt>
            <dd class="tabular-nums text-xs text-muted-foreground truncate">
              {{ auth.householdId ?? '—' }}
            </dd>
          </div>
        </dl>
        <div class="mt-4">
          <Button variant="outline" @click="onLogout">
            <LogOut />
            Sair desta conta
          </Button>
        </div>
      </Card>

      <!-- Aparência -->
      <Card padded>
        <header class="mb-2">
          <Label>Aparência</Label>
        </header>
        <p class="text-sm text-muted-foreground">
          Vision Finance usa <strong class="text-foreground">dark mode</strong> nativo —
          alinhado ao design system.
        </p>
      </Card>
    </div>
  </section>
</template>
