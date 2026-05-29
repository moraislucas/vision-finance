<script setup lang="ts">
/**
 * Tooltip — wrapper de reka-ui (`TooltipRoot`/`TooltipTrigger`/`TooltipContent`).
 *
 * Uso: <Tooltip text="Editar"><button>...</button></Tooltip>
 * O `Provider` é montado uma vez no App.vue.
 */
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
} from 'reka-ui';

withDefaults(
  defineProps<{
    text: string;
    /** Lado de aparição. */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Atraso para abrir, em ms. */
    delay?: number;
  }>(),
  { side: 'top', delay: 200 },
);
</script>

<template>
  <TooltipRoot :delay-duration="delay" :disable-hoverable-content="true">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side"
        :side-offset="6"
        class="z-[70] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-elevated data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 duration-150"
      >
        {{ text }}
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
