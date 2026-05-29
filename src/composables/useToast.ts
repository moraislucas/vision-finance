/**
 * Toast minimalista global. Para evolução: trocar por `vue-sonner` ou similar.
 * Por enquanto: array reativo simples consumido por `<AppToasts />` no layout.
 */
import { ref } from 'vue';

export type ToastSeverity = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

function push(message: string, severity: ToastSeverity = 'info', timeoutMs = 3500): void {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, message, severity }];
  if (timeoutMs > 0) {
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, timeoutMs);
  }
}

export function useToast() {
  return {
    toasts,
    success: (msg: string) => push(msg, 'success'),
    error: (msg: string) => push(msg, 'error', 5000),
    info: (msg: string) => push(msg, 'info'),
    dismiss: (id: number) => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    },
  };
}
