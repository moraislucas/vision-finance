<script setup lang="ts">
/**
 * ConfirmDialog — ESTILO.MD §10.
 *
 * Mesma estratégia do Sheet: wrapper de layout com `pointer-events-none` para
 * centralização via flex (evitando o bug de transform com tailwindcss-animate),
 * Content com `pointer-events-auto` para receber cliques.
 */
import { watch, ref } from 'vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui';
import Button from './Button.vue';

const props = defineProps<{
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}>();
const emit = defineEmits<{
  'update:open': [open: boolean];
  confirm: [];
}>();

const loading = ref(false);

watch(
  () => props.open,
  (v) => {
    if (!v) loading.value = false;
  },
);

function onConfirm() {
  loading.value = true;
  emit('confirm');
  emit('update:open', false);
}
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => $emit('update:open', v)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-background/70 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200"
      />
      <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <DialogContent
          class="pointer-events-auto w-full max-w-sm bg-card border border-border shadow-elevated rounded-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200 ease-smooth"
        >
          <DialogTitle class="text-base font-semibold tracking-tight">
            {{ title }}
          </DialogTitle>
          <DialogDescription
            v-if="description"
            class="mt-1.5 text-sm text-muted-foreground"
          >
            {{ description }}
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" @click="$emit('update:open', false)">
              {{ cancelText ?? 'Cancelar' }}
            </Button>
            <Button
              :variant="destructive ? 'destructive' : 'default'"
              size="sm"
              :loading="loading"
              @click="onConfirm"
            >
              {{ confirmText ?? 'Confirmar' }}
            </Button>
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
