-- =============================================================================
-- Vision Finance — Migration inicial (0001_init.sql)
-- Implementa integralmente a seção 7 do VISION_FINANCE_CONTEXT.md:
--   7.1 households + profiles + current_household_id()
--   7.2 accounts + credit_cards
--   7.3 categories + transactions
--   7.4 recurring_incomes + recurring_expenses
--   7.5 credit_card_purchases
--   7.6 goals + goal_contributions (com trigger para current_amount)
--   7.7 settings
--   7.8 RLS por household em todas as tabelas
--   7.9 Seed de categorias padrão (trigger ao criar household)
--
-- Princípios respeitados:
--   - Nenhum valor calculado persistido (exceto goals.current_amount, que é
--     mantido por trigger a partir de goal_contributions — seção 5/7.6).
--   - Escopo familiar via household_id + RLS.
--   - Tipos canônicos: uuid PK, numeric(14,2) para moeda, timestamptz para auditoria.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 7.1 Households e profiles
-- -----------------------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Casa',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);
create index profiles_household_idx on profiles (household_id);

-- Helper canônico: household do usuário logado.
-- security definer + search_path explícito para evitar capture de schema.
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- 7.2 Contas (banco/dinheiro) e cartões
-- -----------------------------------------------------------------------------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null default 'bank' check (type in ('bank', 'cash')),
  initial_balance numeric(14,2) not null default 0,
  include_in_available boolean not null default true,
  icon text,
  color text,
  created_at timestamptz not null default now()
);
create index accounts_household_idx on accounts (household_id);

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  limit_amount numeric(14,2) not null default 0,
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  active boolean not null default true,
  icon text,
  color text,
  created_at timestamptz not null default now()
);
create index credit_cards_household_idx on credit_cards (household_id);

-- -----------------------------------------------------------------------------
-- 7.3 Categorias
-- -----------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index categories_household_idx on categories (household_id);
create unique index categories_household_name_type_uniq on categories (household_id, name, type);

-- -----------------------------------------------------------------------------
-- 7.4 Recorrentes (templates de projeção) — declarados ANTES de transactions
-- pois transactions referencia ambos via FK (reconciliação previsto × realizado).
-- -----------------------------------------------------------------------------
create table recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index recurring_incomes_household_idx on recurring_incomes (household_id);

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  due_day smallint not null check (due_day between 1 and 31),
  -- due_month: 1..12, obrigatório apenas para frequency='yearly'. NULL para mensais.
  -- O CHECK abaixo garante a regra; a engine usa para somar a parcela só no mês alvo.
  due_month smallint check (due_month is null or due_month between 1 and 12),
  category_id uuid references categories(id) on delete set null,
  frequency text not null default 'monthly' check (frequency in ('monthly', 'yearly')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recurring_expenses_yearly_requires_month
    check ((frequency = 'monthly' and due_month is null)
        or (frequency = 'yearly'  and due_month is not null))
);
create index recurring_expenses_household_idx on recurring_expenses (household_id);

-- -----------------------------------------------------------------------------
-- 7.5 Cartão de crédito: compras (parcelas calculadas em memória — seção 9.4)
-- -----------------------------------------------------------------------------
create table credit_card_purchases (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  description text not null,
  total_amount numeric(14,2) not null check (total_amount > 0),
  installments smallint not null default 1 check (installments >= 1),
  purchase_date date not null,
  created_at timestamptz not null default now()
);
create index credit_card_purchases_card_idx on credit_card_purchases (household_id, credit_card_id);

-- -----------------------------------------------------------------------------
-- 7.3 (cont.) Transações — com vínculos opcionais de origem (reconciliação).
-- -----------------------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  date date not null,
  notes text,
  recurring_income_id uuid references recurring_incomes(id) on delete set null,
  recurring_expense_id uuid references recurring_expenses(id) on delete set null,
  credit_card_purchase_id uuid references credit_card_purchases(id) on delete set null,
  created_at timestamptz not null default now()
);
create index transactions_household_date_idx on transactions (household_id, date);
create index transactions_household_category_idx on transactions (household_id, category_id);
create index transactions_household_account_idx on transactions (household_id, account_id);
create index transactions_recurring_income_idx on transactions (recurring_income_id) where recurring_income_id is not null;
create index transactions_recurring_expense_idx on transactions (recurring_expense_id) where recurring_expense_id is not null;

-- -----------------------------------------------------------------------------
-- 7.6 Cofrinhos / metas
-- -----------------------------------------------------------------------------
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0,
  target_date date,
  monthly_contribution numeric(14,2),
  is_emergency boolean not null default false,
  active boolean not null default true,
  icon text,
  color text,
  created_at timestamptz not null default now()
);
create index goals_household_idx on goals (household_id);

create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  amount numeric(14,2) not null,            -- positivo = guardar, negativo = resgatar
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index goal_contributions_goal_idx on goal_contributions (goal_id);
create index goal_contributions_household_date_idx on goal_contributions (household_id, date);

-- goals.current_amount = soma de goal_contributions (seção 7.6). Trigger garante
-- consistência mesmo se o app esquecer de atualizar.
create or replace function public.recalc_goal_current_amount(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.goals g
  set current_amount = coalesce((
    select sum(amount) from public.goal_contributions where goal_id = p_goal_id
  ), 0)
  where g.id = p_goal_id;
end;
$$;

create or replace function public.goal_contributions_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalc_goal_current_amount(old.goal_id);
    return old;
  else
    perform public.recalc_goal_current_amount(new.goal_id);
    if (tg_op = 'UPDATE' and old.goal_id is distinct from new.goal_id) then
      perform public.recalc_goal_current_amount(old.goal_id);
    end if;
    return new;
  end if;
end;
$$;

create trigger goal_contributions_sync
after insert or update or delete on goal_contributions
for each row execute function public.goal_contributions_after_change();

-- -----------------------------------------------------------------------------
-- 7.7 Configurações por household
-- -----------------------------------------------------------------------------
create table settings (
  household_id uuid primary key references households(id) on delete cascade,
  currency text not null default 'BRL',
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  monthly_budget numeric(14,2),
  budget_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7.9 Seed de categorias padrão — disparado ao criar um household.
-- Cores e ícones espelham src/lib/constants/categories.ts.
-- -----------------------------------------------------------------------------
create or replace function public.seed_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (household_id, name, type, icon, color, is_default) values
    -- Receita
    (p_household_id, 'Salário',      'income',  'briefcase',         '#22C55E', true),
    (p_household_id, 'Freelance',    'income',  'laptop',            '#10B981', true),
    (p_household_id, 'Extra',        'income',  'sparkles',          '#06B6D4', true),
    (p_household_id, 'Reembolso',    'income',  'undo-2',            '#0EA5E9', true),
    -- Despesa
    (p_household_id, 'Alimentação',  'expense', 'utensils',          '#F97316', true),
    (p_household_id, 'Mercado',      'expense', 'shopping-cart',     '#EAB308', true),
    (p_household_id, 'Transporte',   'expense', 'car',               '#3B82F6', true),
    (p_household_id, 'Saúde',        'expense', 'heart-pulse',       '#EF4444', true),
    (p_household_id, 'Educação',     'expense', 'graduation-cap',    '#8B5CF6', true),
    (p_household_id, 'Lazer',        'expense', 'gamepad-2',         '#EC4899', true),
    (p_household_id, 'Moradia',      'expense', 'home',              '#14B8A6', true),
    (p_household_id, 'Assinaturas',  'expense', 'badge-dollar-sign', '#A855F7', true),
    (p_household_id, 'Cartão',       'expense', 'credit-card',       '#6366F1', true),
    (p_household_id, 'Outros',       'expense', 'ellipsis',          '#71717A', true)
  on conflict (household_id, name, type) do nothing;
end;
$$;

create or replace function public.households_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories(new.id);
  insert into public.settings (household_id) values (new.id)
    on conflict (household_id) do nothing;
  return new;
end;
$$;

create trigger households_bootstrap
after insert on households
for each row execute function public.households_after_insert();

-- =============================================================================
-- 7.8 RLS — escopo familiar idêntico para todas as tabelas de domínio.
-- profiles tem variação: usuário vê o próprio + outros do mesmo household.
-- =============================================================================

-- Habilita RLS em tudo.
alter table households            enable row level security;
alter table profiles              enable row level security;
alter table accounts              enable row level security;
alter table credit_cards          enable row level security;
alter table categories            enable row level security;
alter table recurring_incomes     enable row level security;
alter table recurring_expenses    enable row level security;
alter table credit_card_purchases enable row level security;
alter table transactions          enable row level security;
alter table goals                 enable row level security;
alter table goal_contributions    enable row level security;
alter table settings              enable row level security;

-- households: ler só o próprio; criação/edição via service_role do owner (sem
-- cadastro público — seção 7.8 nota).
create policy households_select on households for select
  using (id = public.current_household_id());

-- profiles: ler quem está no mesmo household; editar só o próprio.
create policy profiles_select on profiles for select
  using (household_id = public.current_household_id());
create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Padrão repetido (select/insert/update/delete escopado por household).
-- accounts
create policy accounts_select on accounts for select using (household_id = public.current_household_id());
create policy accounts_insert on accounts for insert with check (household_id = public.current_household_id());
create policy accounts_update on accounts for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy accounts_delete on accounts for delete using (household_id = public.current_household_id());

-- credit_cards
create policy credit_cards_select on credit_cards for select using (household_id = public.current_household_id());
create policy credit_cards_insert on credit_cards for insert with check (household_id = public.current_household_id());
create policy credit_cards_update on credit_cards for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy credit_cards_delete on credit_cards for delete using (household_id = public.current_household_id());

-- categories
create policy categories_select on categories for select using (household_id = public.current_household_id());
create policy categories_insert on categories for insert with check (household_id = public.current_household_id());
create policy categories_update on categories for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy categories_delete on categories for delete using (household_id = public.current_household_id());

-- recurring_incomes
create policy recurring_incomes_select on recurring_incomes for select using (household_id = public.current_household_id());
create policy recurring_incomes_insert on recurring_incomes for insert with check (household_id = public.current_household_id());
create policy recurring_incomes_update on recurring_incomes for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy recurring_incomes_delete on recurring_incomes for delete using (household_id = public.current_household_id());

-- recurring_expenses
create policy recurring_expenses_select on recurring_expenses for select using (household_id = public.current_household_id());
create policy recurring_expenses_insert on recurring_expenses for insert with check (household_id = public.current_household_id());
create policy recurring_expenses_update on recurring_expenses for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy recurring_expenses_delete on recurring_expenses for delete using (household_id = public.current_household_id());

-- credit_card_purchases
create policy credit_card_purchases_select on credit_card_purchases for select using (household_id = public.current_household_id());
create policy credit_card_purchases_insert on credit_card_purchases for insert with check (household_id = public.current_household_id());
create policy credit_card_purchases_update on credit_card_purchases for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy credit_card_purchases_delete on credit_card_purchases for delete using (household_id = public.current_household_id());

-- transactions
create policy transactions_select on transactions for select using (household_id = public.current_household_id());
create policy transactions_insert on transactions for insert with check (household_id = public.current_household_id());
create policy transactions_update on transactions for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy transactions_delete on transactions for delete using (household_id = public.current_household_id());

-- goals
create policy goals_select on goals for select using (household_id = public.current_household_id());
create policy goals_insert on goals for insert with check (household_id = public.current_household_id());
create policy goals_update on goals for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy goals_delete on goals for delete using (household_id = public.current_household_id());

-- goal_contributions
create policy goal_contributions_select on goal_contributions for select using (household_id = public.current_household_id());
create policy goal_contributions_insert on goal_contributions for insert with check (household_id = public.current_household_id());
create policy goal_contributions_update on goal_contributions for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy goal_contributions_delete on goal_contributions for delete using (household_id = public.current_household_id());

-- settings (1 linha por household — PK é o household_id)
create policy settings_select on settings for select using (household_id = public.current_household_id());
create policy settings_insert on settings for insert with check (household_id = public.current_household_id());
create policy settings_update on settings for update using (household_id = public.current_household_id()) with check (household_id = public.current_household_id());
create policy settings_delete on settings for delete using (household_id = public.current_household_id());
