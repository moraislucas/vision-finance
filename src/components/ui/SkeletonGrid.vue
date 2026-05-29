<script setup lang="ts">
/**
 * SkeletonGrid — placeholder para grids de cards (Goals, CreditCards, Accounts).
 */
import Skeleton from './Skeleton.vue';
import Card from './Card.vue';

withDefaults(
  defineProps<{
    count?: number;
    height?: string;
  }>(),
  { count: 3, height: 'h-44' },
);
</script>

<template>
  <div class="grid gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3">
    <Card v-for="i in count" :key="i" padded :class="`flex flex-col gap-3 ${height}`">
      <div class="flex items-center gap-2">
        <Skeleton variant="circle" class="size-9 shrink-0" />
        <Skeleton variant="text" class="w-2/3" />
      </div>
      <Skeleton class="h-7 w-1/2 rounded-md" />
      <div class="mt-auto space-y-2">
        <Skeleton variant="text" class="w-full opacity-60" />
        <Skeleton variant="text" class="w-3/4 opacity-60" />
      </div>
    </Card>
  </div>
</template>
