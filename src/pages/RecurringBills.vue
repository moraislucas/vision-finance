<script setup lang="ts">
import { ref } from 'vue';
import { Pencil, Trash2, FileClock } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useRecurringExpenseStore, useRecurringIncomeStore } from '@/stores/recurring';
import { useToast } from '@/composables/useToast';
import { formatCurrency } from '@/lib/helpers/format';
import type { RecurringExpense, RecurringIncome } from '@/types/domain';

import Card from '@/components/ui/Card.vue';
import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonList from '@/components/ui/SkeletonList.vue';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Switch from '@/components/ui/Switch.vue';
import Tooltip from '@/components/ui/Tooltip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import RecurringIncomeForm from '@/components/recurring/RecurringIncomeForm.vue';
import RecurringExpenseForm from '@/components/recurring/RecurringExpenseForm.vue';

const data = useDataStore();
const incomeStore = useRecurringIncomeStore();
const expenseStore = useRecurringExpenseStore();
const toast = useToast();

type Mode = 'income' | 'expense';
const sheetOpen = ref(false);
const sheetMode = ref<Mode>('expense');
const editingIncome = ref<RecurringIncome | null>(null);
const editingExpense = ref<RecurringExpense | null>(null);

const confirmDeleteOpen = ref(false);
const toDeleteId = ref<string | null>(null);
const toDeleteMode = ref<Mode>('expense');
const toDeleteName = ref<string>('');

const confirmToggleOpen = ref(false);
const togglePending = ref<{
  mode: Mode;
  id: string;
  name: string;
  next: boolean;
} | null>(null);

function openCreate(mode: Mode) {
  sheetMode.value = mode;
  editingIncome.value = null;
  editingExpense.value = null;
  sheetOpen.value = true;
}
function openEditIncome(ri: RecurringIncome) {
  sheetMode.value = 'income';
  editingIncome.value = ri;
  sheetOpen.value = true;
}
function openEditExpense(re: RecurringExpense) {
  sheetMode.value = 'expense';
  editingExpense.value = re;
  sheetOpen.value = true;
}

function askDelete(mode: Mode, id: string, name: string) {
  toDeleteMode.value = mode;
  toDeleteId.value = id;
  toDeleteName.value = name;
  confirmDeleteOpen.value = true;
}
async function doDelete() {
  if (!toDeleteId.value) return;
  try {
    if (toDeleteMode.value === 'income') await incomeStore.remove(toDeleteId.value);
    else await expenseStore.remove(toDeleteId.value);
    toast.success('Removido.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDeleteId.value = null;
  }
}

/** O Switch é controlado: clicar abre o ConfirmDialog antes de persistir. */
function askToggle(mode: Mode, id: string, name: string, currentActive: boolean) {
  togglePending.value = { mode, id, name, next: !currentActive };
  confirmToggleOpen.value = true;
}
async function doToggle() {
  if (!togglePending.value) return;
  const { mode, id, next } = togglePending.value;
  try {
    if (mode === 'income') await incomeStore.update(id, { active: next });
    else await expenseStore.update(id, { active: next });
    toast.success(next ? 'Reativada.' : 'Desativada.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.');
  } finally {
    togglePending.value = null;
  }
}

function categoryNameOf(re: RecurringExpense): string | null {
  if (!re.category_id) return null;
  return data.categories.find((c) => c.id === re.category_id)?.name ?? null;
}
function categoryIconOf(re: RecurringExpense): string | null {
  if (!re.category_id) return null;
  return data.categories.find((c) => c.id === re.category_id)?.icon ?? null;
}
function monthName(m: number): string {
  return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m - 1];
}
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Mensal"
      title="Contas Fixas"
      description="Receitas e despesas que se repetem todo mês. Servem de base para projetar o saldo futuro."
    />

    <!-- Loading -->
    <div v-if="!data.loaded" class="space-y-6">
      <SkeletonList :rows="3" />
      <SkeletonList :rows="4" />
    </div>

    <div v-else class="space-y-6">
      <!-- Receitas recorrentes -->
      <Card padded>
        <div class="mb-4 flex items-end justify-between">
          <div>
            <h2 class="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
              Receitas
            </h2>
            <p class="text-sm text-muted-foreground">
              Salário, freelas e qualquer entrada previsível.
            </p>
          </div>
          <Button size="sm" @click="openCreate('income')">+ Receita</Button>
        </div>

        <EmptyState
          v-if="data.recurringIncomes.length === 0"
          title="Sem receitas recorrentes"
          description="Adicione, no mínimo, seu salário para o app projetar quanto vai sobrar no fim do mês."
          :icon="FileClock"
        >
          <Button size="sm" @click="openCreate('income')">+ Adicionar receita</Button>
        </EmptyState>

        <ul v-else class="divide-y divide-border">
          <li
            v-for="ri in data.recurringIncomes"
            :key="ri.id"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span
                  class="truncate text-sm font-medium"
                  :class="{ 'text-muted-foreground': !ri.active }"
                >
                  {{ ri.name }}
                </span>
                <Badge v-if="!ri.active">Pausada</Badge>
              </div>
              <p class="text-xs text-muted-foreground">Cai todo dia {{ ri.day_of_month }}</p>
            </div>

            <span
              class="tabular-nums text-sm"
              :class="ri.active ? 'text-success' : 'text-muted-foreground line-through'"
            >
              {{ formatCurrency(Number(ri.amount)) }}
            </span>

            <Tooltip :text="ri.active ? 'Pausar receita' : 'Reativar receita'">
              <div>
                <Switch
                  :model-value="ri.active"
                  size="sm"
                  @update:model-value="askToggle('income', ri.id, ri.name, ri.active)"
                />
              </div>
            </Tooltip>

            <IconButton label="Editar" @click="openEditIncome(ri)">
              <Pencil />
            </IconButton>
            <IconButton
              label="Excluir"
              variant="danger"
              @click="askDelete('income', ri.id, ri.name)"
            >
              <Trash2 />
            </IconButton>
          </li>
        </ul>
      </Card>

      <!-- Despesas fixas -->
      <Card padded>
        <div class="mb-4 flex items-end justify-between">
          <div>
            <h2 class="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
              Despesas Fixas
            </h2>
            <p class="text-sm text-muted-foreground">
              Aluguel, assinaturas, contas anuais como IPTU.
            </p>
          </div>
          <Button size="sm" @click="openCreate('expense')">+ Despesa</Button>
        </div>

        <EmptyState
          v-if="data.recurringExpenses.length === 0"
          title="Sem despesas fixas"
          description="Registre seus compromissos mensais para o app saber quanto está comprometido todo mês."
          :icon="FileClock"
        >
          <Button size="sm" @click="openCreate('expense')">+ Adicionar despesa</Button>
        </EmptyState>

        <ul v-else class="divide-y divide-border">
          <li
            v-for="re in data.recurringExpenses"
            :key="re.id"
            class="flex items-center justify-between gap-3 py-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span v-if="categoryIconOf(re)" class="text-base">{{ categoryIconOf(re) }}</span>
                <span
                  class="truncate text-sm font-medium"
                  :class="{ 'text-muted-foreground': !re.active }"
                >
                  {{ re.name }}
                </span>
                <Badge v-if="!re.active">Pausada</Badge>
                <Badge v-if="re.frequency === 'yearly'" variant="info">
                  Anual · {{ monthName(re.due_month ?? 1) }}
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground">
                Vence dia {{ re.due_day }}<span v-if="categoryNameOf(re)"> · {{ categoryNameOf(re) }}</span>
              </p>
            </div>

            <span
              class="tabular-nums text-sm"
              :class="re.active ? 'text-destructive' : 'text-muted-foreground line-through'"
            >
              {{ formatCurrency(Number(re.amount)) }}
            </span>

            <Tooltip :text="re.active ? 'Pausar despesa' : 'Reativar despesa'">
              <div>
                <Switch
                  :model-value="re.active"
                  size="sm"
                  @update:model-value="askToggle('expense', re.id, re.name, re.active)"
                />
              </div>
            </Tooltip>

            <IconButton label="Editar" @click="openEditExpense(re)">
              <Pencil />
            </IconButton>
            <IconButton
              label="Excluir"
              variant="danger"
              @click="askDelete('expense', re.id, re.name)"
            >
              <Trash2 />
            </IconButton>
          </li>
        </ul>
      </Card>
    </div>

    <Sheet
      :open="sheetOpen"
      :title="
        sheetMode === 'income'
          ? editingIncome
            ? 'Editar receita'
            : 'Nova receita recorrente'
          : editingExpense
            ? 'Editar despesa'
            : 'Nova despesa fixa'
      "
      @update:open="sheetOpen = $event"
    >
      <RecurringIncomeForm
        v-if="sheetMode === 'income'"
        :editing="editingIncome"
        @saved="sheetOpen = false"
        @cancel="sheetOpen = false"
      />
      <RecurringExpenseForm
        v-else
        :editing="editingExpense"
        @saved="sheetOpen = false"
        @cancel="sheetOpen = false"
      />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmDeleteOpen"
      :title="`Excluir ${toDeleteName}?`"
      description="Esta ação não pode ser desfeita."
      confirm-text="Excluir"
      destructive
      @confirm="doDelete"
    />

    <ConfirmDialog
      v-model:open="confirmToggleOpen"
      :title="
        togglePending?.next
          ? `Reativar ${togglePending?.name}?`
          : `Pausar ${togglePending?.name}?`
      "
      :description="
        togglePending?.next
          ? 'Volta a entrar nos cálculos do mês e na projeção.'
          : 'Sai dos cálculos do mês e da projeção, mas o cadastro continua salvo.'
      "
      :confirm-text="togglePending?.next ? 'Reativar' : 'Pausar'"
      @confirm="doToggle"
    />
  </section>
</template>
