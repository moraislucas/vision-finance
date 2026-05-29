<script setup lang="ts">
import { computed, h } from 'vue';
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/vue-table';
import { Pencil, Trash2 } from '@lucide/vue';
import { ref } from 'vue';
import { useDataStore } from '@/stores/data';
import { formatCurrency, formatDate } from '@/lib/helpers/format';
import type { Transaction } from '@/types/domain';
import Badge from '@/components/ui/Badge.vue';
import IconButton from '@/components/ui/IconButton.vue';

const props = defineProps<{ transactions: Transaction[] }>();
const emit = defineEmits<{ edit: [tx: Transaction]; remove: [tx: Transaction] }>();
const data = useDataStore();

const sorting = ref<SortingState>([{ id: 'date', desc: true }]);

const columns = computed<ColumnDef<Transaction>[]>(() => [
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Descrição',
    cell: ({ row }) =>
      h('span', { class: 'font-medium text-foreground' }, row.original.description),
  },
  {
    id: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const cat = data.categories.find((c) => c.id === row.original.category_id);
      if (!cat) return h('span', { class: 'text-muted-foreground' }, '—');
      return h(Badge, { color: cat.color }, () => [
        cat.icon ? h('span', null, cat.icon) : null,
        cat.name,
      ]);
    },
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground' }, formatDate(row.original.date)),
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: () => h('span', { class: 'text-right block' }, 'Valor'),
    cell: ({ row }) => {
      const tx = row.original;
      const cls = tx.type === 'income' ? 'text-success' : 'text-destructive';
      const prefix = tx.type === 'income' ? '+' : '−';
      return h(
        'span',
        { class: `block text-right tabular-nums ${cls}` },
        `${prefix} ${formatCurrency(Number(tx.amount))}`,
      );
    },
  },
  {
    id: 'actions',
    header: () => h('span', { class: 'sr-only' }, 'Ações'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(IconButton, {
          label: 'Editar',
          onClick: () => emit('edit', row.original),
        }, () => h(Pencil)),
        h(IconButton, {
          label: 'Excluir',
          variant: 'danger',
          onClick: () => emit('remove', row.original),
        }, () => h(Trash2)),
      ]),
  },
]);

const table = useVueTable({
  get data() {
    return props.transactions;
  },
  get columns() {
    return columns.value;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

function catFor(id: string | null) {
  return id ? data.categories.find((c) => c.id === id) : undefined;
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border bg-card">
    <!-- Desktop table -->
    <table class="hidden w-full md:table">
      <thead class="border-b border-border bg-secondary/30">
        <tr v-for="hg in table.getHeaderGroups()" :key="hg.id">
          <th
            v-for="header in hg.headers"
            :key="header.id"
            class="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80"
          >
            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in table.getRowModel().rows"
          :key="row.id"
          class="border-b border-border last:border-0 hover:bg-secondary/30"
        >
          <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="px-4 py-3">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile cards -->
    <ul class="divide-y divide-border md:hidden">
      <li
        v-for="row in table.getRowModel().rows"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-3"
      >
        <div class="min-w-0 space-y-1">
          <div class="truncate text-sm font-medium">{{ row.original.description }}</div>
          <div class="flex items-center gap-2">
            <Badge
              v-if="catFor(row.original.category_id)"
              :color="catFor(row.original.category_id)?.color ?? null"
            >
              <span v-if="catFor(row.original.category_id)?.icon">
                {{ catFor(row.original.category_id)?.icon }}
              </span>
              {{ catFor(row.original.category_id)?.name }}
            </Badge>
            <span class="text-xs text-muted-foreground">{{ formatDate(row.original.date) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span
            :class="[
              'tabular-nums text-sm',
              row.original.type === 'income' ? 'text-success' : 'text-destructive',
            ]"
          >
            {{ row.original.type === 'income' ? '+' : '−' }} {{ formatCurrency(Number(row.original.amount)) }}
          </span>
          <IconButton label="Editar" @click="emit('edit', row.original)">
            <Pencil />
          </IconButton>
          <IconButton label="Excluir" variant="danger" @click="emit('remove', row.original)">
            <Trash2 />
          </IconButton>
        </div>
      </li>
    </ul>

    <div v-if="table.getRowModel().rows.length === 0" class="p-8 text-center text-sm text-muted-foreground">
      Nenhuma transação no filtro atual.
    </div>
  </div>
</template>
