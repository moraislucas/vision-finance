/**
 * useBreakpoint — espelha as media queries Tailwind padrão.
 * `lg` (1024px) é o ponto de virada mobile↔desktop (ESTILO.MD §8).
 */
import { useMediaQuery } from '@vueuse/core';

export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  return { isMobile, isTablet, isDesktop };
}
