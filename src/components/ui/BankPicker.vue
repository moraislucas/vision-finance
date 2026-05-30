<script setup lang="ts">
/**
 * BankPicker — grade de marcas de banco para os formulários de Conta/Cartão.
 * `v-model` expõe o slug (ou null = genérico). Emite `select` com a marca
 * escolhida (ou null) para o pai poder, p.ex., auto-preencher a cor.
 */
import { Check, Ban } from '@lucide/vue';
import { BANKS, type BankBrand } from '@/lib/constants/banks';
import { cn } from '@/lib/utils';

const model = defineModel<string | null>({ default: null });
const emit = defineEmits<{ select: [bank: BankBrand | null] }>();

function pick(bank: BankBrand | null) {
  model.value = bank?.slug ?? null;
  emit('select', bank);
}
</script>

<template>
  <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
    <!-- Genérico / nenhum -->
    <button
      type="button"
      :class="
        cn(
          'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors',
          model === null
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-border/80',
        )
      "
      @click="pick(null)"
    >
      <span class="grid size-8 place-items-center rounded-lg bg-secondary/60 text-muted-foreground">
        <Ban class="size-4" />
      </span>
      <span class="text-[11px] leading-tight text-muted-foreground">Genérico</span>
    </button>

    <!-- Marcas -->
    <button
      v-for="bank in BANKS"
      :key="bank.slug"
      type="button"
      :class="
        cn(
          'relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors',
          model === bank.slug
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-border/80',
        )
      "
      @click="pick(bank)"
    >
      <span
        v-if="model === bank.slug"
        class="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Check class="size-2.5" />
      </span>
      <span class="grid size-8 place-items-center rounded-lg bg-secondary ring-1 ring-border/60">
        <img :src="bank.logo" :alt="bank.label" class="size-[68%] object-contain" />
      </span>
      <span class="truncate text-[11px] leading-tight">{{ bank.label }}</span>
    </button>
  </div>
</template>
