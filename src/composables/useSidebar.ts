/**
 * Estado do Sidebar — colapsado/expandido, persistido em localStorage para
 * sobreviver a refresh. Compartilhado entre Sidebar.vue e AppLayout.vue.
 */
import { useStorage } from '@vueuse/core';

const collapsed = useStorage<boolean>('vf:sidebar-collapsed', false);

export function useSidebar() {
  function toggle(): void {
    collapsed.value = !collapsed.value;
  }
  return { collapsed, toggle };
}
