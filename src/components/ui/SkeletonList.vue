<script setup lang="ts">
/**
 * SkeletonList — placeholder de loading para listagens. Renderiza N "linhas"
 * com ícone circular + duas linhas de texto + valor à direita. Imita o shape
 * típico das listas do app.
 */
import Skeleton from './Skeleton.vue';
import Card from './Card.vue';

withDefaults(
  defineProps<{
    rows?: number;
    /** Quando true, embrulha em Card (para listas com fundo próprio). */
    inCard?: boolean;
  }>(),
  { rows: 4, inCard: true },
);
</script>

<template>
  <component :is="inCard ? Card : 'div'" :padded="inCard ? true : undefined">
    <ul class="divide-y divide-border">
      <li v-for="i in rows" :key="i" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <Skeleton variant="circle" class="size-9 shrink-0" />
        <div class="flex-1 space-y-2">
          <Skeleton variant="text" class="w-2/5" />
          <Skeleton variant="text" class="w-3/5 opacity-60" />
        </div>
        <Skeleton class="h-5 w-16 shrink-0 rounded-md" />
      </li>
    </ul>
  </component>
</template>
