<script setup lang="ts">
/**
 * Toast container — ESTILO.MD §10 (Toast).
 * Mobile: topo, lateral; Desktop: bottom-right. Tons semafóricos.
 */
import { CheckCircle2, AlertCircle, Info } from '@lucide/vue';
import { useToast } from '@/composables/useToast';
import { cn } from '@/lib/utils';

const { toasts, dismiss } = useToast();

const iconFor = (s: string) =>
  s === 'success' ? CheckCircle2 : s === 'error' ? AlertCircle : Info;

const toneClass = (s: string) =>
  s === 'success'
    ? 'border-success/30 bg-success/10 text-success'
    : s === 'error'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-info/30 bg-info/10 text-info';
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed z-[60] flex flex-col gap-2
             top-4 right-4 left-4
             md:left-auto md:top-auto md:bottom-4 md:max-w-sm"
    >
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        :class="
          cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-elevated bg-card',
            'animate-fade-in-up text-left',
            toneClass(t.severity),
          )
        "
        @click="dismiss(t.id)"
      >
        <component :is="iconFor(t.severity)" class="size-4 shrink-0 mt-0.5" />
        <span class="flex-1 text-foreground/90 leading-snug">{{ t.message }}</span>
      </button>
    </div>
  </Teleport>
</template>
