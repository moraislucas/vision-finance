-- =============================================================================
-- Vision Finance — Helpers de bootstrap (0002)
--
-- Reduz o atrito de configurar o casal:
--   1. `seed_default_household(name)` — cria a household se ainda não existir
--      (idempotente). Retorna o id.
--   2. Trigger em `auth.users` AFTER INSERT — cria o `profiles` row
--      automaticamente sempre que um usuário for criado no painel
--      Authentication, sem precisar copiar UUID nenhum.
--   3. `bootstrap_status()` — função utilitária para conferir o estado
--      do setup (quantas households, profiles, usuários existem).
--
-- Importante: continua sem cadastro público. O trigger só REAGE a inserts
-- feitos pelo service_role (painel/CLI/SQL editor); usuários comuns não
-- podem inserir em `auth.users`.
--
-- Como usar (sequência completa):
--
--   -- A. (Uma vez) — cria a household.
--   select public.seed_default_household('Minha Casa');
--
--   -- B. No painel Supabase → Authentication → Users → Add user (x2).
--   --    Marque "Auto Confirm User". Opcional: em "User metadata" coloque
--   --    {"name": "Lucas"} para personalizar o nome no profile.
--   --    Os profiles aparecem automaticamente via trigger.
--
--   -- C. Confira o estado.
--   select * from public.bootstrap_status();
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. seed_default_household — cria a "casa" se não existir
-- -----------------------------------------------------------------------------
create or replace function public.seed_default_household(p_name text default 'Minha Casa')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  -- Idempotente: se já houver household, devolve a primeira (V1 = casa única).
  select id into hid from public.households order by created_at limit 1;
  if hid is not null then
    return hid;
  end if;

  insert into public.households (name) values (p_name) returning id into hid;
  return hid;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Trigger em auth.users → cria profile automaticamente
-- -----------------------------------------------------------------------------
-- Resolução do household_id (em ordem):
--   a) raw_user_meta_data->>'household_id' (cast para uuid), se passado.
--   b) Caso contrário, a única household existente.
--   c) Caso contrário, levanta exceção — orienta a rodar seed_default_household().
--
-- Resolução do name:
--   a) raw_user_meta_data->>'name', se passado.
--   b) Caso contrário, prefixo do email (parte antes do @).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  resolved_name text;
  count_households int;
begin
  -- (a) household_id explícito via metadata?
  begin
    hid := nullif(new.raw_user_meta_data->>'household_id', '')::uuid;
  exception when others then
    hid := null;
  end;

  -- (b) inferir pela única household existente
  if hid is null then
    select count(*) into count_households from public.households;
    if count_households = 0 then
      raise exception
        'Nenhuma household existe. Rode antes: select public.seed_default_household();';
    elsif count_households > 1 then
      raise exception
        'Múltiplas households (%) existem. Passe household_id em raw_user_meta_data ao criar o usuário.',
        count_households;
    end if;
    select id into hid from public.households limit 1;
  end if;

  resolved_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, household_id, name, email)
  values (new.id, hid, resolved_name, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 3. bootstrap_status — confere o estado do setup
-- -----------------------------------------------------------------------------
create or replace function public.bootstrap_status()
returns table (
  households_count int,
  profiles_count int,
  auth_users_count int,
  categories_count int,
  settings_count int
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*)::int from public.households),
    (select count(*)::int from public.profiles),
    (select count(*)::int from auth.users),
    (select count(*)::int from public.categories),
    (select count(*)::int from public.settings)
$$;

-- -----------------------------------------------------------------------------
-- 4. Backfill — se você já criou usuários no painel ANTES desta migration,
--    o trigger não chegou a rodar pra eles. Esta query cobre o gap.
--
-- Critério: para cada auth.users que NÃO tem profile correspondente:
--   - usa a única household se houver,
--   - infere o name pelo prefixo do email.
-- Idempotente (não cria nada se já existir profile).
-- -----------------------------------------------------------------------------
do $$
declare
  hid uuid;
  hcount int;
begin
  select count(*) into hcount from public.households;
  if hcount = 1 then
    select id into hid from public.households limit 1;
    insert into public.profiles (id, household_id, name, email)
    select
      u.id,
      hid,
      split_part(u.email, '@', 1),
      u.email
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null and u.email is not null
    on conflict (id) do nothing;
  end if;
end $$;
