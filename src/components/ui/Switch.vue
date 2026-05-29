<script setup lang="ts">
/**
 * Switch (toggle) — reka-ui `SwitchRoot` / `SwitchThumb`.
 *
 * Estilo: pílula 44x24 com thumb circular que desliza, bg-primary quando on,
 * bg-secondary quando off. Foco com ring-primary/20.
 */
import { SwitchRoot, SwitchThumb } from 'reka-ui';
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
    class?: string;
  }>(),
  { disabled: false, size: 'md' },
);
defineEmits<{ 'update:modelValue': [v: boolean] }>();

const sizes = {
  sm: { root: 'h-5 w-9', thumb: 'size-4', translate: 'data-[state=checked]:translate-x-4' },
  md: { root: 'h-6 w-11', thumb: 'size-5', translate: 'data-[state=checked]:translate-x-5' },
};
const s = computed(() => sizes[props.size ?? 'md']);
</script>

<template>
  <SwitchRoot
    :model-value="modelValue"
    :disabled="disabled"
    :class="
      cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=unchecked]:bg-secondary data-[state=unchecked]:border-border',
        'data-[state=checked]:bg-primary',
        s.root,
        $props.class,
      )
    "
    @update:model-value="(v: boolean) => $emit('update:modelValue', v)"
  >
    <SwitchThumb
      :class="
        cn(
          'pointer-events-none block translate-x-0.5 rounded-full bg-white shadow-soft ring-0 transition-transform duration-200 ease-smooth',
          s.thumb,
          s.translate,
        )
      "
    />
  </SwitchRoot>
</template>
