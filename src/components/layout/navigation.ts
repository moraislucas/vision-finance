/**
 * Fonte única dos itens de navegação — ESTILO.MD §11.
 * Filtre por `mobile`/`desktop` no consumidor (Sidebar vs BottomNav).
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
  mobile: boolean;
  desktop: boolean;
  /** Agrupamento na Sidebar (desktop). */
  section?: 'main' | 'control' | 'strategy' | 'settings';
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
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
  {
    label: 'Ajustes',
    to: { name: 'settings' },
    icon: Settings,
    mobile: true,
    desktop: true,
    section: 'settings',
  },
];

export const sectionTitles: Record<NonNullable<NavItem['section']>, string> = {
  main: 'Organização',
  control: 'Controle Financeiro',
  strategy: 'Visão Estratégica',
  settings: 'Configurações',
};
