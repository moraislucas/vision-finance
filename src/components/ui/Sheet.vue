<script setup lang="ts">
/**
 * Sheet/Modal — ESTILO.MD §10.
 * Bottom-sheet no mobile (sobe de baixo), modal centralizado em md+ com zoom-in.
 *
 * Centralização via flex no wrapper (NÃO via `-translate-x-1/2 -translate-y-1/2`,
 * porque tailwindcss-animate reescreve a transform durante a animação e provoca
 * um "salto" lateral do modal). O wrapper recebe `pointer-events-none` (assim
 * não bloqueia cliques mesmo que o reka-ui não desmonte) e o Content recebe
 * `pointer-events-auto` — clicks na área externa caem na DialogOverlay (que
 * tem seu próprio handler para fechar via onPointerDownOutside).
 */
import { computed } from 'vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui';
import { X } from '@lucide/vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);
defineEmits<{ 'update:open': [open: boolean] }>();

const maxW = computed(
  () => ({ sm: 'md:max-w-sm', md: 'md:max-w-lg', lg: 'md:max-w-2xl' })[props.size ?? 'md'],
);
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => $emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-background/70 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200"
      />
      <!-- Wrapper de layout (centraliza via flex). pointer-events-none garante
           que se o reka-ui não desmontar, ainda assim não bloqueia cliques. -->
      <div
        class="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      >
        <DialogContent
          :class="[
            'pointer-events-auto w-full bg-card border border-border shadow-elevated flex flex-col max-h-[90svh]',
            'rounded-t-3xl md:rounded-2xl',
            maxW,
            // Mobile: slide de baixo. Desktop: scale + fade (sem slide).
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4',
            'md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0',
            'md:data-[state=open]:fade-in-0 md:data-[state=open]:zoom-in-95',
            'md:data-[state=closed]:fade-out-0 md:data-[state=closed]:zoom-out-95',
            'duration-200 ease-smooth',
          ]"
        >
          <header
            class="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4"
          >
            <DialogTitle as="h2" class="text-base font-semibold tracking-tight">
              {{ title }}
            </DialogTitle>
            <DialogClose
              class="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              aria-label="Fechar"
            >
              <X class="size-4" />
            </DialogClose>
          </header>
          <!-- Padding bottom = 2rem (pb-8) + env(safe-area-inset-bottom) somados
               via arbitrary value. A classe `.safe-area-bottom` SOBRESCREVE
               qualquer `pb-X` (define padding-bottom: env(...) que em desktop
               é 0), por isso usamos arbitrary value direto. -->
          <div
            class="overflow-y-auto px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
          >
            <slot />
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
