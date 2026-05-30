<script setup lang="ts">
/**
 * MonthlyView — "Ritmo do mês" com tabs Semanas | Calendário.
 *
 * Default = Semanas (plano de gastos/poupança agrupado por semana, expansível
 * em dias). Calendário é a visão secundária (mapa do mês: saldo + eventos).
 */
import { ref } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  ListChecks,
} from '@lucide/vue';
import { today, type Dayjs } from '@/lib/helpers/date';
import Card from '@/components/ui/Card.vue';
import IconButton from '@/components/ui/IconButton.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import WeeklyPlan from './WeeklyPlan.vue';
import CalendarioProjecao from './CalendarioProjecao.vue';

type View = 'weekly' | 'calendar';

const monthRef = ref<Dayjs>(today().startOf('month'));
const view = ref<View>('weekly');

function goPrev(): void {
  monthRef.value = monthRef.value.subtract(1, 'month').startOf('month');
}
function goNext(): void {
  monthRef.value = monthRef.value.add(1, 'month').startOf('month');
}
function goToday(): void {
  monthRef.value = today().startOf('month');
}

const tabs: { value: View; label: string; icon: typeof CalendarDays }[] = [
  { value: 'weekly', label: 'Semanas', icon: ListChecks },
  { value: 'calendar', label: 'Calendário', icon: CalendarDays },
];
</script>

<template>
  <Card class="overflow-hidden p-3 md:p-6">
    <!-- Header — duas linhas no mobile, uma só no desktop -->
    <header class="mb-3 space-y-2 md:mb-4 md:flex md:items-center md:justify-between md:gap-3 md:space-y-0">
      <!-- Linha 1: identidade + título do mês + nav setas/hoje -->
      <div class="flex items-center justify-between gap-3 md:flex-none">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <CalendarRange class="size-4" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
            >
              Ritmo do mês
            </p>
            <p class="text-sm font-semibold capitalize truncate">
              {{ monthRef.format('MMMM YYYY') }}
            </p>
          </div>
        </div>

        <!-- Nav mês (sempre visível) -->
        <div class="flex shrink-0 items-center gap-1">
          <IconButton label="Mês anterior" @click="goPrev">
            <ChevronLeft />
          </IconButton>
          <button
            type="button"
            class="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            @click="goToday"
          >
            Hoje
          </button>
          <IconButton label="Próximo mês" @click="goNext">
            <ChevronRight />
          </IconButton>
        </div>
      </div>

      <!-- Linha 2 (mobile) / inline (desktop): tabs full-width no mobile -->
      <SegmentedControl v-model="view" :options="tabs" block class="md:w-auto" />
    </header>

    <!-- Conteúdo da aba ativa -->
    <WeeklyPlan v-if="view === 'weekly'" :month-ref="monthRef" />
    <CalendarioProjecao v-else :month-ref="monthRef" />
  </Card>
</template>
