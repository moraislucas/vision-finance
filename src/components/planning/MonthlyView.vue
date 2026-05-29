<script setup lang="ts">
/**
 * MonthlyView — orquestrador da seção "Saldo do mês" na Planning.
 *
 * Compartilha o estado do mês entre duas visualizações:
 *   - Calendário (grid 7-col com eventos + saldo por dia)
 *   - Planilha   (tabela vertical Dia/Diário/Saldo)
 *
 * Navegação ‹ Mês AAAA › é única, no header do componente.
 */
import { ref } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListChecks,
  CalendarRange,
} from '@lucide/vue';
import { today, type Dayjs } from '@/lib/helpers/date';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card.vue';
import IconButton from '@/components/ui/IconButton.vue';
import CalendarioProjecao from './CalendarioProjecao.vue';
import DailyLedger from './DailyLedger.vue';

type View = 'calendar' | 'sheet';

const monthRef = ref<Dayjs>(today().startOf('month'));
const view = ref<View>('calendar');

function goPrev(): void {
  monthRef.value = monthRef.value.subtract(1, 'month').startOf('month');
}
function goNext(): void {
  monthRef.value = monthRef.value.add(1, 'month').startOf('month');
}
function goToday(): void {
  monthRef.value = today().startOf('month');
}

const tabs: { id: View; label: string; icon: typeof CalendarDays }[] = [
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'sheet', label: 'Planilha', icon: ListChecks },
];
</script>

<template>
  <Card padded class="overflow-hidden">
    <!-- Header: nav mês + tabs -->
    <header
      class="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2">
        <div
          class="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"
        >
          <CalendarRange class="size-4" />
        </div>
        <div>
          <p
            class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium"
          >
            Saldo do mês
          </p>
          <p class="text-sm font-semibold capitalize">
            {{ monthRef.format('MMMM YYYY') }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 sm:gap-3">
        <!-- Tabs Calendário / Planilha -->
        <div
          class="inline-flex items-center gap-1 rounded-full bg-secondary/60 p-1 ring-1 ring-border/60"
        >
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            :class="
              cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                view === t.id
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )
            "
            @click="view = t.id"
          >
            <component :is="t.icon" class="size-3.5" />
            {{ t.label }}
          </button>
        </div>

        <!-- Nav mês -->
        <div class="flex items-center gap-1">
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
    </header>

    <!-- Conteúdo da aba ativa -->
    <CalendarioProjecao v-if="view === 'calendar'" :month-ref="monthRef" />
    <DailyLedger v-else :month-ref="monthRef" />
  </Card>
</template>
