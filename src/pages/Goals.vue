<script setup lang="ts">
import { ref } from 'vue';
import { PiggyBank } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useGoalStore } from '@/stores/goals';
import { useToast } from '@/composables/useToast';
import type { Goal } from '@/types/domain';

import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue';
import Button from '@/components/ui/Button.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import GoalCard from '@/components/goals/GoalCard.vue';
import GoalForm from '@/components/goals/GoalForm.vue';
import ContributionForm from '@/components/goals/ContributionForm.vue';

const data = useDataStore();
const store = useGoalStore();
const toast = useToast();

const goalSheetOpen = ref(false);
const editing = ref<Goal | null>(null);

const contribSheetOpen = ref(false);
const contribTarget = ref<Goal | null>(null);
const contribMode = ref<'deposit' | 'withdraw'>('deposit');

const confirmOpen = ref(false);
const toDelete = ref<Goal | null>(null);

function openCreate() {
  editing.value = null;
  goalSheetOpen.value = true;
}
function openEdit(g: Goal) {
  editing.value = g;
  goalSheetOpen.value = true;
}
function openDeposit(g: Goal) {
  contribTarget.value = g;
  contribMode.value = 'deposit';
  contribSheetOpen.value = true;
}
function openWithdraw(g: Goal) {
  contribTarget.value = g;
  contribMode.value = 'withdraw';
  contribSheetOpen.value = true;
}
function askDelete(g: Goal) {
  toDelete.value = g;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.removeGoal(toDelete.value.id);
    toast.success('Meta excluída.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDelete.value = null;
  }
}
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Onde guardar"
      title="Cofrinhos"
      description="Reserve dinheiro para suas metas. O valor continua na sua conta, mas o app desconta do quanto você pode gastar."
    >
      <template #actions>
        <Button @click="openCreate">+ Nova meta</Button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <SkeletonGrid v-if="!data.loaded" :count="3" height="h-56" />

    <!-- Empty -->
    <EmptyState
      v-else-if="data.goals.length === 0"
      title="Nenhum cofrinho ainda"
      description="Comece criando uma reserva de emergência — o ideal é juntar 3× suas despesas fixas mensais."
      :icon="PiggyBank"
    >
      <Button @click="openCreate">+ Criar primeira meta</Button>
    </EmptyState>

    <!-- Cards -->
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <GoalCard
        v-for="g in data.goals"
        :key="g.id"
        :goal="g"
        @edit="openEdit(g)"
        @remove="askDelete(g)"
        @deposit="openDeposit(g)"
        @withdraw="openWithdraw(g)"
      />
    </div>

    <Sheet
      :open="goalSheetOpen"
      :title="editing ? 'Editar meta' : 'Nova meta'"
      @update:open="goalSheetOpen = $event"
    >
      <GoalForm
        :editing="editing"
        @saved="goalSheetOpen = false"
        @cancel="goalSheetOpen = false"
      />
    </Sheet>

    <Sheet
      :open="contribSheetOpen"
      :title="contribMode === 'deposit' ? 'Guardar dinheiro' : 'Resgatar dinheiro'"
      @update:open="contribSheetOpen = $event"
    >
      <ContributionForm
        v-if="contribTarget"
        :goal="contribTarget"
        :mode="contribMode"
        @saved="contribSheetOpen = false"
        @cancel="contribSheetOpen = false"
      />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Excluir meta?"
      :description="
        toDelete
          ? `“${toDelete.name}” será removida junto com todo o histórico de aportes. Esta ação não pode ser desfeita.`
          : ''
      "
      confirm-text="Excluir meta"
      destructive
      @confirm="doDelete"
    />
  </section>
</template>
