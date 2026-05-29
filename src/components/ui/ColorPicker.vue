<script setup lang="ts">
/**
 * ColorPicker — paleta fixa de cores do sistema, chips clicáveis.
 *
 * Foco em coerência visual: as 10 cores aqui são as mesmas usadas para
 * categorias e marcadores (compatíveis com o tema). Quando preciso de cor
 * customizada, dá pra evoluir adicionando um botão "+" que abre um picker
 * nativo — não fazemos isso aqui pra manter o look limpo.
 */
import { Check } from '@lucide/vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    palette?: string[];
    class?: string;
  }>(),
  {
    palette: () => [
      '#0A84FF', // Apple blue
      '#22C55E', // green
      '#10B981', // emerald
      '#06B6D4', // cyan
      '#F59E0B', // amber
      '#F97316', // orange
      '#EF4444', // red
      '#EC4899', // pink
      '#8B5CF6', // violet
      '#71717A', // gray
    ],
  },
);
defineEmits<{ 'update:modelValue': [v: string] }>();
void props;
</script>

<template>
  <div :class="cn('flex flex-wrap gap-2', $props.class)" role="radiogroup">
    <button
      v-for="hex in palette"
      :key="hex"
      type="button"
      :aria-label="`Cor ${hex}`"
      :aria-checked="modelValue?.toLowerCase() === hex.toLowerCase()"
      role="radio"
      :class="
        cn(
          'group relative grid size-8 place-items-center rounded-xl ring-1 ring-border/60 transition-transform duration-200 ease-smooth hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          modelValue?.toLowerCase() === hex.toLowerCase() && 'ring-2 ring-foreground',
        )
      "
      :style="{ backgroundColor: hex }"
      @click="$emit('update:modelValue', hex)"
    >
      <Check
        v-if="modelValue?.toLowerCase() === hex.toLowerCase()"
        class="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
      />
    </button>
  </div>
</template>
