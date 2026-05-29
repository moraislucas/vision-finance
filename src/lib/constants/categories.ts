/**
 * Categorias padrão (seção 7.9) — espelham o seed da migration.
 *
 * `icon` agora carrega um **emoji** (1 grapheme) em vez de um nome de ícone
 * Lucide. Mantemos o nome da coluna (`icon`) para não quebrar o schema.
 */
export interface DefaultCategory {
  name: string;
  type: 'income' | 'expense';
  icon: string; // emoji
  color: string; // hex
}

export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  // Receita
  { name: 'Salário', type: 'income', icon: '💼', color: '#22C55E' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#10B981' },
  { name: 'Extra', type: 'income', icon: '✨', color: '#06B6D4' },
  { name: 'Reembolso', type: 'income', icon: '↩️', color: '#0EA5E9' },

  // Despesa
  { name: 'Alimentação', type: 'expense', icon: '🍽️', color: '#F97316' },
  { name: 'Mercado', type: 'expense', icon: '🛒', color: '#EAB308' },
  { name: 'Transporte', type: 'expense', icon: '🚗', color: '#3B82F6' },
  { name: 'Saúde', type: 'expense', icon: '🏥', color: '#EF4444' },
  { name: 'Educação', type: 'expense', icon: '🎓', color: '#8B5CF6' },
  { name: 'Lazer', type: 'expense', icon: '🎮', color: '#EC4899' },
  { name: 'Moradia', type: 'expense', icon: '🏠', color: '#14B8A6' },
  { name: 'Assinaturas', type: 'expense', icon: '📺', color: '#A855F7' },
  { name: 'Cartão', type: 'expense', icon: '💳', color: '#0A84FF' },
  { name: 'Outros', type: 'expense', icon: '📦', color: '#71717A' },
] as const;
