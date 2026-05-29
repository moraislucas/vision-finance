-- =============================================================================
-- Vision Finance — Migration 0003: emojis em categorias
--
-- O campo `categories.icon` agora carrega EMOJI (1 grapheme) em vez de nome de
-- ícone Lucide. Esta migration:
--   1. Atualiza a função `seed_default_categories` (chamada pelo trigger
--      `households_bootstrap`) para inserir as categorias com emojis.
--   2. Faz BACKFILL — atualiza categorias existentes que ainda usam nome
--      Lucide para o emoji equivalente, identificadas por (name, type).
--
-- Idempotente: re-rodar é seguro.
-- =============================================================================

-- 1. Re-cria seed_default_categories com emojis.
create or replace function public.seed_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, type, icon, color, is_default) values
    -- Receita
    (p_household_id, 'Salário',      'income',  '💼', '#22C55E', true),
    (p_household_id, 'Freelance',    'income',  '💻', '#10B981', true),
    (p_household_id, 'Extra',        'income',  '✨', '#06B6D4', true),
    (p_household_id, 'Reembolso',    'income',  '↩️', '#0EA5E9', true),
    -- Despesa
    (p_household_id, 'Alimentação',  'expense', '🍽️', '#F97316', true),
    (p_household_id, 'Mercado',      'expense', '🛒', '#EAB308', true),
    (p_household_id, 'Transporte',   'expense', '🚗', '#3B82F6', true),
    (p_household_id, 'Saúde',        'expense', '🏥', '#EF4444', true),
    (p_household_id, 'Educação',     'expense', '🎓', '#8B5CF6', true),
    (p_household_id, 'Lazer',        'expense', '🎮', '#EC4899', true),
    (p_household_id, 'Moradia',      'expense', '🏠', '#14B8A6', true),
    (p_household_id, 'Assinaturas',  'expense', '📺', '#A855F7', true),
    (p_household_id, 'Cartão',       'expense', '💳', '#0A84FF', true),
    (p_household_id, 'Outros',       'expense', '📦', '#71717A', true)
  on conflict (household_id, name, type) do nothing;
end;
$$;

-- 2. Backfill: troca ícones Lucide pelos emojis nas categorias já existentes.
--    Identifica por (name, type) — só categorias padrão são alvo (is_default=true),
--    para não bagunçar categorias customizadas pelo usuário.
update public.categories set icon = '💼' where is_default = true and type = 'income'  and name = 'Salário';
update public.categories set icon = '💻' where is_default = true and type = 'income'  and name = 'Freelance';
update public.categories set icon = '✨' where is_default = true and type = 'income'  and name = 'Extra';
update public.categories set icon = '↩️' where is_default = true and type = 'income'  and name = 'Reembolso';

update public.categories set icon = '🍽️' where is_default = true and type = 'expense' and name = 'Alimentação';
update public.categories set icon = '🛒' where is_default = true and type = 'expense' and name = 'Mercado';
update public.categories set icon = '🚗' where is_default = true and type = 'expense' and name = 'Transporte';
update public.categories set icon = '🏥' where is_default = true and type = 'expense' and name = 'Saúde';
update public.categories set icon = '🎓' where is_default = true and type = 'expense' and name = 'Educação';
update public.categories set icon = '🎮' where is_default = true and type = 'expense' and name = 'Lazer';
update public.categories set icon = '🏠' where is_default = true and type = 'expense' and name = 'Moradia';
update public.categories set icon = '📺' where is_default = true and type = 'expense' and name = 'Assinaturas';
update public.categories set icon = '💳' where is_default = true and type = 'expense' and name = 'Cartão';
update public.categories set icon = '📦' where is_default = true and type = 'expense' and name = 'Outros';

-- (Opcional, comentado) — se quiser dar um emoji default a categorias que o
-- usuário criou sem emoji, descomente:
-- update public.categories set icon = '🏷️' where icon is null or icon = '';
