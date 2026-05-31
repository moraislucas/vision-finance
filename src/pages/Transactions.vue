<script setup lang="ts">
import { computed, ref } from 'vue';
import { SlidersHorizontal } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useTransactionStore } from '@/stores/transactions';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@/lib/helpers/format';
import type { Transaction } from '@/types/domain';

import Card from '@/components/ui/Card.vue';
import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import Input from '@/components/ui/Input.vue';
import Select from '@/components/ui/Select.vue';
import Label from '@/components/ui/Label.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonList from '@/components/ui/SkeletonList.vue';
import Button from '@/components/ui/Button.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FloatingAddButton from '@/components/layout/FloatingAddButton.vue';
import TransactionForm from '@/components/transactions/TransactionForm.vue';
import TransactionTable from '@/components/transactions/TransactionTable.vue';

const data = useDataStore();
const store = useTransactionStore();
const toast = useToast();

const sheetOpen = ref(false);
const editing = ref<Transaction | null>(null);
const confirmOpen = ref(false);
const toDelete = ref<Transaction | null>(null);

function openCreate() {
  editing.value = null;
  sheetOpen.value = true;
}
function openEdit(tx: Transaction) {
  editing.value = tx;
  sheetOpen.value = true;
}
function askDelete(tx: Transaction) {
  toDelete.value = tx;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.remove(toDelete.value.id);
    toast.success('Transação excluída.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDelete.value = null;
  }
}

const typeOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
];

const categoryOptions = computed(() => [
  { value: 'all' as const, label: 'Todas as categorias' },
  ...data.categories.map((c) => ({ value: c.id, label: c.name })),
]);
const accountOptions = computed(() => [
  { value: 'all' as const, label: 'Todas as contas' },
  ...data.accounts.map((a) => ({ value: a.id, label: a.name })),
]);

const isEmpty = computed(() => data.transactions.length === 0);

// Filtros em sheet no mobile: conta quantos estão ativos (busca à parte).
const filtersOpen = ref(false);
const activeFilterCount = computed(
  () =>
    [
      store.filters.type !== 'all',
      store.filters.categoryId !== 'all',
      store.filters.accountId !== 'all',
    ].filter(Boolean).length,
);
function clearFilters() {
  store.filters.type = 'all';
  store.filters.categoryId = 'all';
  store.filters.accountId = 'all';
}
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Histórico"
      title="Transações"
      description="Lance receitas e despesas. Tudo reflete na hora no seu saldo e na projeção."
    >
      <template #actions>
        <Button class="hidden md:inline-flex" @click="openCreate">+ Nova transação</Button>
      </template>
    </PageHeader>

    <!-- Filtros (desktop): grid inline -->
    <Card padded class="hidden md:block">
      <div class="grid gap-3 md:grid-cols-5">
        <div class="space-y-1.5 md:col-span-2">
          <Label for="search">Buscar</Label>
          <Input id="search" v-model="store.filters.search" placeholder="Descrição da transação…" />
        </div>
        <div class="space-y-1.5">
          <Label>Tipo</Label>
          <Select v-model="store.filters.type" :options="typeOptions" />
        </div>
        <div class="space-y-1.5">
          <Label>Categoria</Label>
          <Select v-model="store.filters.categoryId" :options="categoryOptions" />
        </div>
        <div class="space-y-1.5">
          <Label>Conta</Label>
          <Select v-model="store.filters.accountId" :options="accountOptions" />
        </div>
      </div>
    </Card>

    <!-- Filtros (mobile): busca + botão que abre o sheet -->
    <div class="flex gap-2 md:hidden">
      <Input
        v-model="store.filters.search"
        placeholder="Buscar transação…"
        class="flex-1"
        aria-label="Buscar transação"
      />
      <Button
        variant="outline"
        class="relative h-11 shrink-0"
        aria-label="Abrir filtros"
        @click="filtersOpen = true"
      >
        <SlidersHorizontal />
        Filtros
        <span
          v-if="activeFilterCount"
          class="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums"
        >
          {{ activeFilterCount }}
        </span>
      </Button>
    </div>

    <!-- Totais -->
    <div class="mt-3 grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
      <Card padded>
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Lançamentos
        </p>
        <p class="mt-1 text-xl font-semibold tabular-nums">{{ store.totals.count }}</p>
      </Card>
      <Card padded>
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Entradas
        </p>
        <p class="mt-1 text-xl font-semibold tabular-nums text-success">
          {{ formatCurrency(store.totals.income) }}
        </p>
      </Card>
      <Card padded>
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Saídas
        </p>
        <p class="mt-1 text-xl font-semibold tabular-nums text-destructive">
          {{ formatCurrency(store.totals.expense) }}
        </p>
      </Card>
      <Card padded>
        <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          Saldo do filtro
        </p>
        <p
          class="mt-1 text-xl font-semibold tabular-nums"
          :class="store.totals.net >= 0 ? 'text-success' : 'text-destructive'"
        >
          {{ formatCurrency(store.totals.net) }}
        </p>
      </Card>
    </div>

    <div class="mt-3">
      <!-- Loading -->
      <SkeletonList v-if="!data.loaded" :rows="6" />

      <!-- Empty -->
      <EmptyState
        v-else-if="isEmpty"
        title="Nenhuma transação ainda"
        description="Comece registrando uma receita ou despesa para ver o produto ganhar vida."
      >
        <Button @click="openCreate">+ Nova transação</Button>
      </EmptyState>

      <!-- Tabela -->
      <TransactionTable
        v-else
        :transactions="store.filtered"
        @edit="openEdit"
        @remove="askDelete"
      />
    </div>

    <FloatingAddButton class="md:hidden" @click="openCreate" />

    <!-- Sheet de filtros (mobile) -->
    <Sheet :open="filtersOpen" title="Filtros" @update:open="filtersOpen = $event">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <Label>Tipo</Label>
          <Select v-model="store.filters.type" :options="typeOptions" />
        </div>
        <div class="space-y-1.5">
          <Label>Categoria</Label>
          <Select v-model="store.filters.categoryId" :options="categoryOptions" />
        </div>
        <div class="space-y-1.5">
          <Label>Conta</Label>
          <Select v-model="store.filters.accountId" :options="accountOptions" />
        </div>
        <div class="flex gap-2 pt-2">
          <Button
            variant="outline"
            class="flex-1"
            :disabled="!activeFilterCount"
            @click="clearFilters"
          >
            Limpar
          </Button>
          <Button class="flex-1" @click="filtersOpen = false">
            Ver {{ store.totals.count }} resultado{{ store.totals.count === 1 ? '' : 's' }}
          </Button>
        </div>
      </div>
    </Sheet>

    <Sheet
      :open="sheetOpen"
      :title="editing ? 'Editar transação' : 'Nova transação'"
      @update:open="sheetOpen = $event"
    >
      <TransactionForm
        :editing="editing"
        @saved="sheetOpen = false"
        @cancel="sheetOpen = false"
      />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Excluir transação?"
      :description="
        toDelete
          ? `“${toDelete.description}” — ${formatCurrency(Number(toDelete.amount))}. Esta ação não pode ser desfeita.`
          : ''
      "
      confirm-text="Excluir"
      destructive
      @confirm="doDelete"
    />
  </section>
</template>
