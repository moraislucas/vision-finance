/**
 * Fonte única dos itens de navegação — ESTILO.MD §11.
 * Filtre por `mobile`/`desktop` no consumidor (Sidebar vs BottomNav).
 *
 * Mobile: apenas 4 itens prioritários aparecem na BottomNav.
 * Demais ficam acessíveis pelo botão "Mais" (MoreMenuSheet).
 */
import {
  LayoutDashboard,
  ArrowRightLeft,
  LineChart,
  PiggyBank,
  CreditCard,
  FileClock,
  Tag,
  Wallet,
  Settings,
} from '@lucide/vue';
import type { FunctionalComponent, SVGAttributes } from 'vue';

export interface NavItem {
  label: string;
  to: { name: string };
  icon: FunctionalComponent<SVGAttributes>;
  /** Aparece direto na BottomNav do mobile (4 slots). */
  mobile: boolean;
  /** Aparece na Sidebar do desktop. */
  desktop: boolean;
  /** Agrupamento na Sidebar e no MoreMenuSheet. */
  section?: 'main' | 'control' | 'strategy' | 'settings';
}

export const navItems: NavItem[] = [
  {
    label: 'Início',
    to: { name: 'dashboard' },
    icon: LayoutDashboard,
    mobile: true,
    desktop: true,
    section: 'main',
  },
  {
    label: 'Transações',
    to: { name: 'transactions' },
    icon: ArrowRightLeft,
    mobile: true,
    desktop: true,
    section: 'control',
  },
  {
    label: 'Planejamento',
    to: { name: 'planning' },
    icon: LineChart,
    mobile: true,
    desktop: true,
    section: 'strategy',
  },
  {
    label: 'Cofrinhos',
    to: { name: 'goals' },
    icon: PiggyBank,
    mobile: true,
    desktop: true,
    section: 'strategy',
  },
  // ↓ os abaixo só na Sidebar desktop e no menu "Mais" mobile.
  {
    label: 'Contas',
    to: { name: 'accounts' },
    icon: Wallet,
    mobile: false,
    desktop: true,
    section: 'control',
  },
  {
    label: 'Contas Fixas',
    to: { name: 'recurring-bills' },
    icon: FileClock,
    mobile: false,
    desktop: true,
    section: 'control',
  },
  {
    label: 'Cartões',
    to: { name: 'credit-cards' },
    icon: CreditCard,
    mobile: false,
    desktop: true,
    section: 'control',
  },
  {
    label: 'Categorias',
    to: { name: 'categories' },
    icon: Tag,
    mobile: false,
    desktop: true,
    section: 'control',
  },
  {
    label: 'Ajustes',
    to: { name: 'settings' },
    icon: Settings,
    mobile: false,
    desktop: true,
    section: 'settings',
  },
];

export const sectionTitles: Record<NonNullable<NavItem['section']>, string> = {
  main: 'Visão geral',
  control: 'Controle Financeiro',
  strategy: 'Visão Estratégica',
  settings: 'Configurações',
};
