<script setup lang="ts">
import { computed, ref } from 'vue';
import { Pencil, Trash2, Tag } from '@lucide/vue';
import { useDataStore } from '@/stores/data';
import { useCategoryStore } from '@/stores/categories';
import { useToast } from '@/composables/useToast';
import type { Category } from '@/types/domain';

import Card from '@/components/ui/Card.vue';
import Sheet from '@/components/ui/Sheet.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SkeletonList from '@/components/ui/SkeletonList.vue';
import IconButton from '@/components/ui/IconButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import FloatingAddButton from '@/components/layout/FloatingAddButton.vue';
import CategoryForm from '@/components/categories/CategoryForm.vue';

const data = useDataStore();
const store = useCategoryStore();
const toast = useToast();

const sheetOpen = ref(false);
const editing = ref<Category | null>(null);
const confirmOpen = ref(false);
const toDelete = ref<Category | null>(null);

function openCreate() {
  editing.value = null;
  sheetOpen.value = true;
}
function openEdit(c: Category) {
  editing.value = c;
  sheetOpen.value = true;
}
function askDelete(c: Category) {
  toDelete.value = c;
  confirmOpen.value = true;
}
async function doDelete() {
  if (!toDelete.value) return;
  try {
    await store.remove(toDelete.value.id);
    toast.success('Categoria excluída.');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
  } finally {
    toDelete.value = null;
  }
}

const groups = computed(() => [
  { title: 'Despesas', list: store.expense, kind: 'expense' as const },
  { title: 'Receitas', list: store.income, kind: 'income' as const },
]);
</script>

<template>
  <section>
    <PageHeader
      eyebrow="Organização"
      title="Categorias"
      description="Use emojis para identificar cada tipo de gasto/receita rapidamente."
    >
      <template #actions>
        <Button @click="openCreate">+ Nova Categoria</Button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="!data.loaded" class="grid gap-4 md:grid-cols-2">
      <SkeletonList :rows="5" />
      <SkeletonList :rows="5" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="data.categories.length === 0"
      title="Nenhuma categoria"
      description="O seed cria 14 categorias padrão ao criar a household. Se está vazio, rode a migration."
      :icon="Tag"
    >
      <Button @click="openCreate">+ Nova Categoria</Button>
    </EmptyState>

    <!-- Listas -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <Card v-for="g in groups" :key="g.kind" padded>
        <h2 class="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
          {{ g.title }}
        </h2>
        <ul v-if="g.list.length" class="divide-y divide-border">
          <li
            v-for="c in g.list"
            :key="c.id"
            class="flex items-center justify-between gap-3 py-2.5"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-xl border text-lg"
                :style="{
                  backgroundColor: `${c.color ?? '#71717A'}1A`,
                  borderColor: `${c.color ?? '#71717A'}40`,
                }"
              >
                {{ c.icon || '🏷️' }}
              </span>
              <span class="truncate text-sm font-medium">{{ c.name }}</span>
              <Badge v-if="c.is_default">Padrão</Badge>
            </div>
            <div class="flex items-center gap-1">
              <IconButton label="Editar" @click="openEdit(c)">
                <Pencil />
              </IconButton>
              <IconButton label="Excluir" variant="danger" @click="askDelete(c)">
                <Trash2 />
              </IconButton>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">Nenhuma categoria deste tipo.</p>
      </Card>
    </div>

    <Sheet
      :open="sheetOpen"
      :title="editing ? 'Editar categoria' : 'Nova categoria'"
      @update:open="sheetOpen = $event"
    >
      <CategoryForm :editing="editing" @saved="sheetOpen = false" @cancel="sheetOpen = false" />
    </Sheet>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Excluir categoria?"
      :description="
        toDelete
          ? `Transações que usam “${toDelete.name}” ficarão sem categoria. Esta ação não pode ser desfeita.`
          : ''
      "
      confirm-text="Excluir"
      destructive
      @confirm="doDelete"
    />

    <FloatingAddButton class="md:hidden" label="Nova categoria" @click="openCreate" />
  </section>
</template>
