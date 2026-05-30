<script setup lang="ts" generic="T extends string | number">
/**
 * SegmentedControl — toggle de opções (pill track + opção ativa em destaque).
 *
 * Padroniza os três toggles que existiam soltos (Pode Gastar dia/semana/mês,
 * Projeção 3/6/12, Ritmo do mês Semanas/Calendário). O estado ativo usa
 * `bg-primary` para feedback inequívoco — clicar sempre mostra resposta clara.
 *
 * Uso:
 *   <SegmentedControl v-model="mode" :options="[{ value:'day', label:'Dia' }]" />
 *   <SegmentedControl v-model="view" :options="tabs" block />   (full-width)
 */
import type { Component } from 'vue';

withDefaults(
  defineProps<{
    modelValue: T;
    options: { value: T; label: string; icon?: Component }[];
    /** Ocupa a largura toda, distribuindo as opções igualmente. */
    block?: boolean;
    size?: 'sm' | 'md';
  }>(),
  { block: false, size: 'md' },
);

defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <div
    :class="[
      'rounded-full bg-secondary/60 p-1 ring-1 ring-border/60',
      block ? 'flex w-full' : 'inline-flex items-center gap-1',
    ]"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      :aria-pressed="modelValue === opt.value"
      :class="[
        'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs',
        block ? 'flex-1' : '',
        modelValue === opt.value
          ? 'bg-primary text-primary-foreground shadow-soft'
          : 'text-muted-foreground hover:text-foreground',
      ]"
      @click="$emit('update:modelValue', opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="size-3.5" />
      {{ opt.label }}
    </button>
  </div>
</template>
