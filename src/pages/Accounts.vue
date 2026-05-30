<script setup lang="ts">
import { computed, ref } from 'vue';
import { Pencil, Trash2, Wallet, Eye, EyeOff } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useAccountStore } from '@/stores/accounts';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@/lib/helpers/format';
import { getAccountBalance } from '@/lib/finance';
import type { Account } from '@/types/domain';

import Card from '@/components/ui/Card.vue';
import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import Button from '@/components/ui/Button.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue';
import Badge from '@/components/ui/Badge.vue';
import IconButton from '@/components/ui/IconButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import BankLogo from '@/components/ui/BankLogo.vue';
import FloatingAddButton from '@/components/layout/FloatingAddButton.vue';
import AccountForm from '@/components/accounts/AccountForm.vue';

const data = useDataStore();
const store = useAccountStore();
const toast = useToast();

const sheetOpen = ref(false);
const editing = ref<Account | null>(null);
const confirmOpen = ref(false);
const toDelete = ref<Account | null>(null);

function openCreate() {
  editing.value = null;
  sheetOpen.value = true;
}
function openEdit(a: Account) {
  editing.value = a;
  sheetOpen.value = true;
}
function askDelete(a: Account) {
  toDelete.value = a;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.remove(toDelete.value.id);
    toast.success('Conta excluída.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDelete.value = null;
  }
}

const balances = computed(() =>
  data.accounts.map((a) => ({ account: a, balance: getAccountBalance(a, data.transactions) })),
);
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Onde fica seu dinheiro"
      title="Contas"
      description="Cadastre os bancos e a carteira. O saldo é calculado pelo inicial mais suas transações."
    >
      <template #actions>
        <Button @click="openCreate">+ Nova conta</Button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <SkeletonGrid v-if="!data.loaded" :count="3" height="h-36" />

    <!-- Empty -->
    <EmptyState
      v-else-if="balances.length === 0"
      title="Nenhuma conta cadastrada"
      description="Crie sua primeira conta (banco ou dinheiro) para começar a lançar transações."
      :icon="Wallet"
    >
      <Button @click="openCreate">+ Adicionar conta</Button>
    </EmptyState>

    <!-- Lista -->
    <div v-else class="grid gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="row in balances" :key="row.account.id" padded>
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 items-center gap-3">
            <BankLogo
              :slug="row.account.icon"
              :name="row.account.name"
              :color="row.account.color"
            />
            <div class="min-w-0">
              <h3 class="truncate text-base font-semibold">{{ row.account.name }}</h3>
              <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge>{{ row.account.type === 'bank' ? 'Banco' : 'Dinheiro' }}</Badge>
                <span class="flex items-center gap-1">
                  <component
                    :is="row.account.include_in_available ? Eye : EyeOff"
                    class="size-3"
                  />
                  {{
                    row.account.include_in_available ? 'conta no total' : 'fora do total'
                  }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 gap-1">
            <IconButton label="Editar conta" @click="openEdit(row.account)">
              <Pencil />
            </IconButton>
            <IconButton label="Excluir conta" variant="danger" @click="askDelete(row.account)">
              <Trash2 />
            </IconButton>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
            Saldo atual
          </p>
          <p class="tabular-nums text-2xl font-semibold">{{ formatCurrency(row.balance) }}</p>
        </div>
      </Card>
    </div>

    <Sheet
      :open="sheetOpen"
      :title="editing ? 'Editar conta' : 'Nova conta'"
      @update:open="sheetOpen = $event"
    >
      <AccountForm :editing="editing" @saved="sheetOpen = false" @cancel="sheetOpen = false" />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Excluir conta?"
      :description="
        toDelete
          ? `“${toDelete.name}” será removida. As transações que estavam nela vão ficar sem conta vinculada e o saldo inicial será perdido.`
          : ''
      "
      confirm-text="Excluir conta"
      destructive
      @confirm="doDelete"
    />

    <FloatingAddButton class="md:hidden" label="Nova conta" @click="openCreate" />
  </section>
</template>
