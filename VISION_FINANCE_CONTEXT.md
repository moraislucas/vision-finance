# VISION FINANCE — Contexto do Projeto (Claude Code)

> **Leia este documento inteiro antes de gerar qualquer código.**
> Ele é a fonte única de verdade do produto. Sempre que houver dúvida de regra de negócio, o que vale é a seção **9. Engine Financeira**. Sempre que houver dúvida de dados, vale a seção **7. Banco de Dados**.
> Prosa em PT-BR; identificadores, tabelas e funções em inglês.

---

## 0. Como usar este documento

1. Crie o projeto exatamente com a stack da seção 4 e a estrutura de pastas da seção 10.
2. Aplique o SQL da seção 7 no Supabase (migrations) **antes** do frontend.
3. Implemente a **Engine Financeira (seção 9) como módulo puro e testável** antes das telas. Nenhuma tela calcula nada por conta própria.
4. Construa as telas na ordem da seção 17 (milestones), mobile-first.
5. No fim, valide tudo contra o **Checklist de Aceite (seção 18)**.

---

## 1. Visão geral & filosofia

**Vision Finance** é uma aplicação web (mobile-first) de controle financeiro **pessoal e familiar**, usada inicialmente por **um casal** (duas pessoas, mesma base de dados compartilhada).

O diferencial **não** é registrar o passado. É **prever o futuro** e responder, automaticamente, à única pergunta que importa:

> **"Quanto eu posso gastar hoje/essa semana/esse mês sem me ferrar no fim do mês?"**

Tudo no produto — telas, cálculos, design — serve a essa pergunta e às derivadas:

- Quanto posso gastar hoje / esta semana / este mês?
- Quanto vou ter no fim do mês? E nos próximos 3, 6, 12 meses?
- Para onde meu dinheiro está indo?
- Quanto está comprometido com contas fixas, parcelas e cartão?
- Quanto preciso guardar para minhas metas — e isso já está reservado do que posso gastar?

**Tagline:** *"Pare de olhar o saldo. Comece a olhar seu futuro."*

---

## 2. Escopo da V1

### Dentro (construir agora)
- Autenticação (login/logout/recuperar senha) — **sem cadastro público**.
- Contas manuais (banco e dinheiro) e cartões de crédito.
- Transações manuais (receita/despesa) com categorias.
- Receitas recorrentes e contas fixas (templates de projeção).
- Cartões: compras à vista e parceladas → geração de parcelas futuras e faturas.
- Cofrinhos/metas com cálculo de contribuição mensal/semanal/diária.
- **Engine Financeira**: Saldo Atual, Disponível, Saldo Projetado, Pode Gastar, Projeção 3/6/12 meses, Score Financeiro.
- Dashboard, Transações, Planejamento, Cofrinhos, Cartões, Contas Fixas, Categorias, Configurações.
- Insights automáticos (regras simples, sem IA).

### Fora da V1 (não construir)
- Open Finance / sincronização bancária automática.
- IA / chat financeiro.
- Importação CSV, notificações, app nativo, compartilhamento externo.
- Investimentos / patrimônio.

> Tudo que for "futuro" deve ser deixado com **arquitetura preparada** (ex.: tabela `accounts` com campo `type`), mas **sem implementação**.

---

## 3. Glossário financeiro (decisões canônicas)

Estes termos têm significado fixo no código inteiro:

| Termo | Significado | Símbolo |
|---|---|---|
| **Saldo Atual** | Soma do saldo de todas as contas bancárias/dinheiro hoje. **Calculado** (saldo inicial + entradas − saídas). Cartão **não** entra aqui. | `B0` |
| **Reservado** | Total já earmarcado em cofrinhos ativos (`current_amount`). O dinheiro continua na conta — é só uma "pendência". | `R` |
| **Disponível agora** | `B0 − R`. O que de fato está livre neste momento. | — |
| **Receita restante do mês** | Receitas recorrentes que ainda vão cair este mês e ainda não caíram. | `Ir` |
| **Obrigações restantes do mês** | Contas fixas pendentes + faturas de cartão a vencer este mês ainda não pagas. | `Or` |
| **Contribuição de meta restante do mês** | Quanto ainda falta guardar este mês para as metas (pendência). | `Cr` |
| **Saldo Projetado (fim do mês)** | `B0 + Ir − Or − Cr`. Cai conforme você gasta o discricionário. | — |
| **Saldo Livre do mês** | `(B0 − R) + Ir − Or − Cr` = `Projetado − R`. Base do "Pode Gastar". | — |
| **Pode Gastar / dia** | `max(0, Saldo Livre do mês) / dias restantes no mês`. | — |

> **Regra de ouro contra contagem dupla:** *reservado (R)* é o que já foi guardado; *contribuição restante (Cr)* é o que ainda falta guardar **este mês**. Nunca some os dois para o mesmo período. Receita/obrigação só contam se **ainda não foram realizadas** (ver reconciliação na seção 9.2).

---

## 4. Stack tecnológica

### Frontend
- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict)
- **Vite**
- **Vue Router** (rotas protegidas via guard)
- **Pinia** (estado global; stores na seção 11)
- **TailwindCSS** + **shadcn-vue** (componentes base)
- **Lucide Vue** (ícones)
- **VueUse** (utilitários reativos)
- **vee-validate** + **Zod** (formulários e validação)
- **ECharts** (`vue-echarts`) — gráficos de projeção, donut de categorias, gauge do score
- **Day.js** (datas; configurar locale `pt-br` e timezone `America/Sao_Paulo`)
- **@tanstack/vue-table** (tabela de transações)
- **@vueuse/motion** (animações sutis)

### Backend
- **Supabase**: Auth + PostgreSQL + Row Level Security. (Edge Functions e Storage ficam para o futuro — não usar na V1.)
- Cliente: `@supabase/supabase-js`.

### Convenções
- Moeda: **BRL**, formatação `Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`.
- Datas armazenadas como `date`/`timestamptz`; UI em `DD/MM/YYYY`.
- Nada de `any`. Tipos derivados do schema do Supabase (`supabase gen types typescript`).

---

## 5. Princípios de arquitetura (inegociáveis)

1. **Fonte única da verdade.** Toda movimentação financeira vive no banco. As telas leem do banco via stores; nunca duplicam estado.
2. **Nenhum valor calculado é persistido.** `saldo`, `projetado`, `pode_gastar`, `score`, `progresso de meta` etc. **não existem como coluna**. São sempre derivados em tempo real pela Engine. (Exceção: `goals.current_amount`, que é progresso de fato, alimentado por `goal_contributions`.)
3. **Engine central única.** Toda inteligência financeira está em `src/lib/finance/`. Componentes só **chamam** funções da engine, nunca reimplementam fórmula.
4. **Reatividade total.** Criar/editar/excluir uma transação recalcula automaticamente Dashboard, Projeção, Cartões, Score, Metas e Pode Gastar — sem refresh manual, sem lógica espalhada.
5. **Mobile-first.** Construir para 390px primeiro; expandir para 768px e 1280px+.
6. **Engine pura e testável.** As funções de `src/lib/finance/` recebem dados puros e devolvem números puros (sem tocar Supabase nem Pinia). Isso permite testes unitários diretos.

---

## 6. Modelo de dados conceitual (como tudo se conecta)

```
profiles ──(household_id)── household (implícito)
   │
   └── todas as tabelas abaixo têm household_id (escopo compartilhado pelo casal)

accounts (banco / dinheiro)            credit_cards (limite, fechamento, vencimento)
   │                                        │
   └──< transactions >── categories         └──< credit_card_purchases (parcelas) 
              │                                          │
   (transaction pode linkar a origem:                    └── (gera N parcelas → faturas por mês)
    recurring_income_id, recurring_expense_id,
    credit_card_purchase_id) ← reconciliação

recurring_incomes (salário etc.)   recurring_expenses (aluguel etc.)   goals + goal_contributions
        └─ alimentam projeção             └─ alimentam projeção              └─ geram pendência mensal
```

**Ideia-chave (a maior correção em relação ao rascunho original):**
Uma `transaction` pode ter um **vínculo de origem** opcional (`recurring_income_id`, `recurring_expense_id`, `credit_card_purchase_id`). Assim a Engine sabe diferenciar **previsto vs. já realizado** e **nunca conta o mesmo dinheiro duas vezes**. Ex.: o aluguel é uma `recurring_expense` (previsto); quando você paga, registra uma `transaction` vinculada a ela → a Engine para de considerá-lo "pendente" naquele mês.

---

## 7. Banco de dados (Supabase / PostgreSQL)

> Aplicar como migration. Todas as tabelas usam `uuid` PK (`default gen_random_uuid()`), `created_at timestamptz default now()`, e **`household_id uuid not null`** para escopo familiar. Valores monetários em `numeric(14,2)`.

### 7.1 Households e profiles

```sql
-- Agrupa a "casa" (o casal). RLS usa isto para compartilhar dados entre os dois usuários.
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Casa',
  created_at timestamptz not null default now()
);

-- 1 profile por usuário do Supabase Auth. Criado manualmente junto com o usuário.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Helper: household do usuário logado (usado em todas as policies)
create or replace function current_household_id()
returns uuid language sql stable security definer set search_path = public as $$
  select household_id from profiles where id = auth.uid()
$$;
```

### 7.2 Contas e cartões

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                       -- ex.: "Carteira da Família", "Nubank", "Dinheiro"
  type text not null default 'bank',        -- 'bank' | 'cash'  (futuro: outros)
  initial_balance numeric(14,2) not null default 0,
  include_in_available boolean not null default true,
  icon text, color text,
  created_at timestamptz not null default now()
);

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  limit_amount numeric(14,2) not null default 0,
  closing_day smallint not null check (closing_day between 1 and 31),  -- dia de fechamento
  due_day smallint not null check (due_day between 1 and 31),          -- dia de vencimento
  active boolean not null default true,
  icon text, color text,
  created_at timestamptz not null default now()
);
```

### 7.3 Categorias e transações

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null,                       -- 'income' | 'expense'
  icon text, color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  type text not null,                       -- 'income' | 'expense'
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  date date not null,
  notes text,
  -- Vínculos de origem para reconciliação (previsto x realizado):
  recurring_income_id uuid references recurring_incomes(id) on delete set null,
  recurring_expense_id uuid references recurring_expenses(id) on delete set null,
  credit_card_purchase_id uuid references credit_card_purchases(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on transactions (household_id, date);
create index on transactions (household_id, category_id);
```

### 7.4 Recorrentes (templates de projeção)

```sql
create table recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                       -- "Salário"
  amount numeric(14,2) not null,
  day_of_month smallint not null check (day_of_month between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                       -- "Aluguel", "Internet"
  amount numeric(14,2) not null,
  due_day smallint not null check (due_day between 1 and 31),
  category_id uuid references categories(id) on delete set null,
  frequency text not null default 'monthly',-- 'monthly' | 'yearly'
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 7.5 Cartão: compras/parcelas

```sql
-- Uma compra no cartão. Se installments > 1, a Engine gera as N parcelas em memória
-- (não persistir cada parcela; calcular pelo cronograma — ver 9.4).
create table credit_card_purchases (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  description text not null,                -- "Notebook"
  total_amount numeric(14,2) not null check (total_amount > 0),
  installments smallint not null default 1 check (installments >= 1),
  purchase_date date not null,
  created_at timestamptz not null default now()
);
create index on credit_card_purchases (household_id, credit_card_id);
```

> **Pagamento de fatura:** quando o casal paga a fatura, registra-se uma `transaction` de despesa (categoria "Cartão") vinculada via `account_id`. A Engine marca aquela fatura como paga (ver 9.4). A V1 pode tratar o pagamento como "fatura do mês quitada" quando existir transação de despesa de categoria Cartão no mês de vencimento ≥ valor da fatura — manter simples e documentado.

### 7.6 Cofrinhos / metas

```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                       -- "Viagem", "Reserva de Emergência"
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,   -- progresso real (alimentado por contributions)
  target_date date,                         -- opcional; se nulo, usar monthly_contribution
  monthly_contribution numeric(14,2),       -- opcional; usado quando não há prazo
  is_emergency boolean not null default false,
  active boolean not null default true,
  icon text, color text,
  created_at timestamptz not null default now()
);

-- Aporte é EARMARK, net-neutro ao saldo (o dinheiro continua na conta). Não é despesa.
create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  amount numeric(14,2) not null,            -- positivo = guardar, negativo = resgatar
  date date not null default current_date,
  created_at timestamptz not null default now()
);
```

> `goals.current_amount` deve ser mantido = soma dos `goal_contributions` da meta. Atualizar via trigger **ou** via store na hora do aporte (preferir trigger para consistência).

### 7.7 Configurações

```sql
create table settings (
  household_id uuid primary key references households(id) on delete cascade,
  currency text not null default 'BRL',
  theme text not null default 'dark',       -- 'dark' | 'light' | 'system'
  monthly_budget numeric(14,2),             -- teto opcional do mês (card "limite")
  budget_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 7.8 RLS (Row Level Security) — escopo familiar

Habilitar RLS em **todas** as tabelas. Padrão idêntico em todas (exemplo para `transactions`; replicar para as demais):

```sql
alter table transactions enable row level security;

create policy "household_select" on transactions for select
  using (household_id = current_household_id());
create policy "household_insert" on transactions for insert
  with check (household_id = current_household_id());
create policy "household_update" on transactions for update
  using (household_id = current_household_id())
  with check (household_id = current_household_id());
create policy "household_delete" on transactions for delete
  using (household_id = current_household_id());
```

Para `profiles`: o usuário só lê/edita o próprio profile (`id = auth.uid()`), mas pode ler profiles do mesmo household (`household_id = current_household_id()`).

> Como não há signup público, o owner cria no painel do Supabase: 1 `households`, depois 2 usuários em Auth, e 2 `profiles` apontando para o mesmo `household_id`. Assim os dois enxergam os mesmos dados.

### 7.9 Seed (categorias padrão)

Ao criar o household, inserir categorias padrão:
- **Receita:** Salário, Freelance, Extra, Reembolso.
- **Despesa:** Alimentação, Mercado, Transporte, Saúde, Educação, Lazer, Moradia, Assinaturas, Cartão, Outros.

Cada uma com `icon` (lucide) e `color` (hex).

---

## 8. Autenticação

- Sem cadastro público. Tela de **Login** (email/senha) + **Esqueci a senha**.
- Após login → redireciona para **Dashboard**.
- **Router guard**: rotas do app são protegidas; sem sessão → `/login`.
- `authStore` guarda sessão, profile e `household_id`. Carregar profile logo após login (necessário para todas as queries via RLS).
- Logout limpa stores e sessão.

---

## 9. Engine Financeira  ⭐ (o coração)

Local: `src/lib/finance/`. Funções **puras** (entrada = dados já carregados; saída = números). Toda data via Day.js com timezone `America/Sao_Paulo`. "Hoje" = `dayjs()`; "mês atual" = mês de hoje.

### 9.1 Saldo Atual

```ts
// Saldo de uma conta = inicial + receitas − despesas (apenas transações com date <= hoje)
accountBalance(account, txs) =
  account.initial_balance
  + Σ tx.amount  (tx.type==='income' && tx.account_id===account.id && tx.date<=hoje)
  − Σ tx.amount  (tx.type==='expense' && tx.account_id===account.id && tx.date<=hoje)

// B0 = Saldo Atual total (só contas com include_in_available)
B0 = Σ accountBalance(a) para a em accounts onde a.include_in_available === true
```

### 9.2 Reconciliação (previsto × realizado) — evita contagem dupla

Para o **mês corrente**:

- Uma `recurring_income` é considerada **já realizada** este mês se existe uma `transaction` deste mês com `recurring_income_id` igual a ela. Caso contrário, é **prevista**.
- Idem para `recurring_expense` (via `recurring_expense_id`).
- Se o usuário não vinculou (lançou solto), a Engine não consegue reconciliar — então:
  - `Ir` (receita restante) só soma recorrentes **não realizadas** e com `day_of_month >= hoje.dia`.
  - `Or` (obrigação restante) só soma fixas **não pagas** e com `due_day >= hoje.dia`.

```ts
Ir = Σ ri.amount  (ri ativo, não realizado este mês, ri.day_of_month >= hoje.dia)
Or = Σ re.amount  (re ativo, não pago este mês, re.due_day >= hoje.dia)
   + Σ fatura.valor (faturas com vencimento neste mês, não pagas, due_day >= hoje.dia)  // ver 9.4
```

### 9.3 Cofrinhos → pendência mensal

```ts
// Quanto a meta exige por mês:
monthlyTarget(goal):
  if goal.target_date:
    months = max(1, mesesEntre(hoje, goal.target_date))   // arredonda pra cima
    return max(0, (goal.target_amount − goal.current_amount)) / months
  else if goal.monthly_contribution:
    return goal.monthly_contribution
  else:
    return 0

monthlyTargetDia(goal)    = monthlyTarget(goal) / diasNoMes(hoje)
monthlyTargetSemana(goal) = monthlyTarget(goal) / 4.345

// Já contribuído este mês para a meta:
contributedThisMonth(goal) = Σ gc.amount (gc.goal_id===goal.id && gc.date no mês atual)

// Pendência de contribuição restante no mês (não some com R!):
Cr = Σ max(0, monthlyTarget(goal) − contributedThisMonth(goal))  para metas ativas

// Reservado total (já guardado, ainda na conta):
R = Σ goal.current_amount  para metas ativas
```

### 9.4 Cartão de crédito → faturas e parcelas

Não persistir parcelas; **calcular o cronograma**:

```ts
// Dado: purchase_date, closing_day, due_day, installments, total_amount
valorParcela = total_amount / installments   // arredondar; última parcela ajusta centavos

// Ciclo-base da compra:
// se purchase_date.dia <= closing_day → fecha no closing_day deste mês (ciclo atual)
// senão → fecha no closing_day do mês seguinte
// A parcela k (k=0..installments-1) cai no ciclo (base + k meses).
// Vencimento do ciclo: se due_day > closing_day → vence no mesmo mês do fechamento;
//                       senão → vence no mês seguinte ao fechamento.
getInstallmentDueDate(purchase, card, k) -> Date

// Fatura de um mês M (de um cartão) = soma das parcelas cuja due_date cai em M.
faturaDoMes(card, M) = Σ valorParcela de todas as parcelas com due_date no mês M

// Fatura considerada PAGA se existe transaction (categoria Cartão) no mês de vencimento
// com amount >= valor da fatura. (V1 simples; documentado.)

// Limite disponível do cartão = limit_amount − Σ parcelas em aberto (não vencidas/não pagas).
```

As faturas a vencer **este mês e não pagas** entram em `Or` (9.2). As parcelas futuras entram na **projeção** (9.6) no mês do respectivo vencimento.

### 9.5 Saldo Projetado, Saldo Livre e Pode Gastar (mês atual)

```ts
diasRestantes = diasNoMes(hoje) − hoje.dia + 1   // inclui hoje

SaldoProjetadoFimMes = B0 + Ir − Or − Cr
SaldoLivreMes        = SaldoProjetadoFimMes − R          // = (B0−R) + Ir − Or − Cr
DisponivelAgora      = B0 − R

PodeGastarMes    = max(0, SaldoLivreMes)
PodeGastarDia    = PodeGastarMes / diasRestantes
PodeGastarSemana = PodeGastarDia × min(7, diasRestantes)
```

> **Por que funciona:** conforme o casal gasta o discricionário, `B0` cai, `SaldoProjetado` e `PodeGastar` caem junto, em tempo real. O dinheiro das metas (R) e a pendência do mês (Cr) ficam protegidos → sobra no fim do mês, exatamente o objetivo declarado.

**Exemplo trabalhado** (dia 10, mês de 30 dias):
- B0 = 5.000; R = 1.500 (já guardado); Ir = 0 (salário já caiu); Or = 1.200 (contas + fatura a vencer); Cr = 500 (falta guardar este mês).
- DisponívelAgora = 5.000 − 1.500 = **3.500**
- SaldoProjetadoFimMes = 5.000 + 0 − 1.200 − 500 = **3.300**
- SaldoLivreMes = 3.300 − 1.500 = **1.800**
- diasRestantes = 30 − 10 + 1 = 21 → PodeGastarDia = 1.800/21 ≈ **R$ 85,71/dia**; Semana ≈ R$ 600.

### 9.6 Projeção 3 / 6 / 12 meses

Simulação mês a mês, começando do fim do mês atual:

```ts
carry = SaldoProjetadoFimMes
projecao[0] = { mes: mesAtual, saldo: carry }

for m = 1..N:
  income_m   = Σ recurring_incomes ativos (valor cheio do mês)
  fixed_m    = Σ recurring_expenses ativos (mensais; anuais só no mês de vencimento)
  faturas_m  = Σ faturaDoMes(card, mesAtual+m) para cada cartão     // parcelas que vencem
  goals_m    = Σ monthlyTarget(goal) enquanto não atingiu a meta/prazo
  // discricionário futuro (opcional, recomendado): média móvel das despesas variáveis
  avgVar     = média das despesas variáveis (não-recorrentes, não-cartão) dos últimos 3 meses
  carry = carry + income_m − fixed_m − faturas_m − goals_m − avgVar
  projecao[m] = { mes: mesAtual+m, saldo: carry }
```

- Mostrar a linha; **destacar em vermelho** meses com `saldo < 0` e exibir alerta ("Atenção: saldo previsto negativo em Agosto").
- `avgVar` deve ser **ligável/desligável** na tela (toggle "incluir gasto médio").

### 9.7 Score Financeiro (0–100)

5 critérios, 20 pontos cada (proporcionais, não binários):

```ts
1. Reserva de emergência:
   alvo = 3 × (Σ recurring_expenses mensais ativos)
   pontos = 20 × min(1, reservaEmergencia.current_amount / alvo)

2. Gasta menos do que ganha (mês atual):
   receitaMes = receitas realizadas + Ir ; despesaMes = despesas realizadas + Or
   pontos = receitaMes>0 ? 20 × clamp((receitaMes − despesaMes)/receitaMes, 0..1) : 0

3. Cumpre metas (no ritmo):
   para cada meta com prazo: esperado = fração de tempo decorrido; real = current/target
   pontos = 20 × média(min(1, real/esperado))   (sem metas → 20)

4. Baixo uso de cartão:
   uso = Σ faturas em aberto / max(1, receita mensal recorrente)
   pontos = 20 × clamp(1 − uso/0.30, 0..1)        (uso ≥30% da renda → 0)

5. Saldo projetado positivo (próximos 3 meses):
   pontos = 20 × (qtd meses com saldo>=0 nos próximos 3) / 3

score = round(Σ pontos)
```

Faixas: **90–100 Excelente · 70–89 Bom · 50–69 Atenção · 0–49 Crítico**.

### 9.8 Insights automáticos (regras, sem IA)

Gerar dinamicamente comparando mês atual × anterior, ex.:
- "Você gastou {x}% mais com {categoria} este mês."
- "Seu cartão compromete {x}% da sua renda nos próximos 3 meses."
- "No ritmo atual, você atinge a meta {nome} em {n} meses."
- "Você pode economizar até R$ {x} este mês."
- Alerta forte se algum mês da projeção for negativo.

### 9.9 Lista de funções obrigatórias da Engine

```
getAccountBalance() / getCurrentBalance() // B0
getReserved()                              // R
getAvailableNow()                          // B0 − R
getRemainingIncome() / getRemainingObligations() // Ir / Or
getRemainingGoalContributions()            // Cr
getProjectedMonthEndBalance()              // SaldoProjetadoFimMes
getFreeBalanceMonth()                      // SaldoLivreMes
getDailyBudget() / getWeeklyBudget() / getMonthlyBudget()
getGoalMonthlyTarget(goal) / getGoalProgress(goal)
getInstallmentDueDate() / getCardInvoice(card, month) / getCardAvailableLimit(card)
getProjection(months)                      // 3/6/12
getFinancialScore()
getInsights()
```

---

## 10. Estrutura de pastas

```
src/
├── assets/
├── components/
│   ├── ui/                # wrappers shadcn-vue
│   ├── dashboard/         # cards: PodeGastar, SaldoProjetado, Economia, ProximasContas
│   ├── charts/            # DonutCategorias, LinhaProjecao, GaugeScore
│   ├── transactions/      # TransactionTable, TransactionForm, FloatingAddButton
│   ├── goals/
│   ├── planning/
│   ├── credit-cards/
│   └── layout/            # Sidebar (desktop), BottomNav (mobile), AppHeader
├── composables/           # useCurrency, useDateRange, useTheme...
├── layouts/
│   ├── AppLayout.vue
│   └── AuthLayout.vue
├── pages/
│   ├── Login.vue
│   ├── Dashboard.vue
│   ├── Transactions.vue
│   ├── Planning.vue       # Projeção + Calendário + Pode Gastar
│   ├── Goals.vue
│   ├── CreditCards.vue
│   ├── RecurringBills.vue
│   ├── Categories.vue
│   └── Settings.vue
├── router/
├── stores/
│   ├── auth.ts
│   ├── data.ts            # carrega/escuta dados crus do Supabase (single source)
│   ├── transactions.ts
│   ├── goals.ts
│   ├── creditCards.ts
│   ├── planning.ts
│   └── dashboard.ts
├── services/
│   └── supabase/          # client + queries por entidade
├── lib/
│   ├── finance/           # ⭐ ENGINE (funções puras) + testes
│   ├── constants/
│   └── helpers/           # format, date
├── types/                 # tipos do Supabase + domínio
└── main.ts
```

> **Recomendação de design de stores:** uma store `data.ts` carrega os dados crus (transactions, accounts, cards, recorrentes, goals, settings) e os mantém reativos. As demais stores expõem **getters computados** que chamam a Engine sobre esses dados crus. Assim a "fonte única da verdade" é literal: tudo deriva de um único conjunto reativo.

---

## 11. Pinia stores

- **authStore** — sessão, profile, `household_id`, login/logout/recover.
- **dataStore** — busca e cacheia os dados crus do household; expõe `refresh()` e mantém arrays reativos. Toda mutação (insert/update/delete) atualiza o array local + persiste no Supabase.
- **transactionStore** — CRUD de transações, filtros (período, tipo, categoria, conta), usa dataStore.
- **goalsStore** — CRUD de metas e aportes; getters: progresso, `monthlyTarget`, pendência.
- **creditCardStore** — CRUD de cartões e compras; getters: fatura por mês, limite disponível, cronograma de parcelas.
- **planningStore** — getters da Engine: projeção 3/6/12, pode gastar, calendário.
- **dashboardStore** — getters dos KPIs principais (B0, projetado, pode gastar, score, próximas contas, donut de categorias, últimas transações).

> Todos os getters financeiros **chamam `src/lib/finance`**. Nenhuma store reimplementa fórmula.

---

## 12. Camada de services (Supabase)

Em `services/supabase/`: um client único + um arquivo por entidade (`transactions.ts`, `accounts.ts`, `creditCards.ts`, `goals.ts`, `recurring.ts`, `settings.ts`) com funções `list/create/update/remove`. Sempre injetar `household_id` do authStore. RLS garante isolamento, mas o app deve setar `household_id` explicitamente nos inserts.

---

## 13. Rotas

| Rota | Página | Proteção |
|---|---|---|
| `/login` | Login | pública |
| `/` | Dashboard | protegida |
| `/transacoes` | Transactions | protegida |
| `/planejamento` | Planning (Projeção/Calendário/Pode Gastar) | protegida |
| `/cofrinhos` | Goals | protegida |
| `/cartoes` | CreditCards | protegida |
| `/contas-fixas` | RecurringBills | protegida |
| `/categorias` | Categories | protegida |
| `/configuracoes` | Settings | protegida |

Guard global: sem sessão → `/login`; com sessão em `/login` → `/`.

---

## 14. Especificação tela a tela (com critérios de aceite)

### Dashboard (`/`)
Cards (mobile: empilhados; desktop: grid):
- **Pode Gastar** (card gigante, destaque): R$/dia, com toggle dia/semana/mês.
- **Saldo Atual** (B0) e **Disponível agora** (B0−R).
- **Saldo Projetado fim do mês**.
- **Economia do mês**: meta vs. guardado (% e barra) — agregado das metas.
- **Próximas contas**: lista de contas fixas + faturas a vencer (nome, valor, dias para vencer).
- **Distribuição dos gastos**: donut por categoria (mês) com valor e %.
- **Últimas transações**: 5 itens, com categoria colorida e valor.
- Botão **+ Nova Transação** (FAB no mobile).

*Aceite:* criar uma despesa atualiza, na hora, Pode Gastar, Saldo Projetado, donut e últimas transações — sem reload.

### Transações (`/transacoes`)
- Tabela (TanStack): descrição, categoria (badge colorida), data, valor (verde/vermelho), ações (editar/excluir).
- Filtros: período, tipo, categoria, conta. Busca por texto.
- Totais do período: nº, entradas, saídas, saldo.
- Modal/sheet **Nova/Editar Transação**: tipo (receita/despesa), descrição, valor, categoria, conta, data, observação. Validação Zod. Cadastro em <5s.

*Aceite:* excluir transação recalcula saldos e dashboard.

### Planejamento (`/planejamento`)
- **Pode Gastar** detalhado (hoje/semana/mês) + a decomposição da fórmula (mostra B0, Ir, Or, Cr, R como linhas).
- **Projeção** 3/6/12 (tabs): gráfico de linha (ECharts), meses negativos em vermelho + alerta. Toggle "incluir gasto médio".
- **Calendário financeiro**: grade do mês com receitas, contas fixas, faturas e aportes nos respectivos dias.

*Aceite:* adicionar uma conta fixa muda a projeção e o pode gastar imediatamente.

### Cofrinhos (`/cofrinhos`)
- Cards de metas: nome, ícone, progresso (%), valor atual/meta, **quanto guardar por mês/semana/dia**, prazo.
- Botão **Aportar** (registra `goal_contribution`) e **Resgatar**.
- Flag "Reserva de emergência".

*Aceite:* criar meta com prazo aumenta `Cr` e reduz Pode Gastar; aportar este mês reduz `Cr`.

### Cartões (`/cartoes`)
- Lista de cartões: nome, limite, **limite disponível**, fatura atual, fechamento/vencimento.
- Detalhe do cartão: fatura atual + próximas faturas (projeção das parcelas), lista de compras.
- **Nova compra**: descrição, valor, categoria, data, parcelas → gera cronograma.

*Aceite:* compra parcelada em 12x aparece nas próximas 12 faturas/projeção; fatura a vencer este mês entra em `Or`.

### Contas Fixas (`/contas-fixas`)
- Lista de recorrentes (receitas e despesas), com valor, dia, categoria, ativo/inativo.
- CRUD. Mensal/anual.

### Categorias (`/categorias`)
- Listar/criar/editar categorias (nome, tipo, ícone, cor). Padrões marcados.

### Configurações (`/configuracoes`)
- Tema (dark/light/system), teto mensal opcional (`monthly_budget`), perfil, logout.

---

## 15. Design system

> Referência visual: os prints do **Visor** (dark, cards, gradientes sutis) + linguagem **Linear/Stripe/Raycast**. Limpo, premium, pouco texto, muito espaço negativo.

### Tema
- **Dark mode nativo** (default). Suportar light e system via `settings.theme`.
- Definir tokens CSS/Tailwind:
  - Fundo: `#0A0A0B` (app), superfícies `#161618`/`#1E1E22`, bordas `#2A2A2E`.
  - Texto: primário `#F5F5F7`, secundário `#A1A1AA`.
  - **Acento/primário:** azul-violeta vibrante (ex.: `#4F46E5`→`#6D28D9` em gradiente), como o roxo dos prints.
  - Semânticos: receita/positivo `#22C55E`, despesa/negativo `#EF4444`, alerta `#F59E0B`.
  - Cores de categoria: paleta de 8–10 tons distintos.
- **Raio de borda:** 16px nos cards; 12px em inputs/botões.
- Sombras sutis; gradientes discretos só em cards de destaque (Pode Gastar).
- Tipografia: Inter (ou similar). Números grandes e legíveis nos KPIs.

### Componentes-base
Botão, Input, Select, Sheet/Modal, Card, Badge (categoria), Tabs, Toggle, Progress, EmptyState, Skeleton (loading). Usar shadcn-vue como base.

### Mobile-first / layout
- **Mobile (390px):** Bottom Navigation (Dashboard, Transações, Planejamento, Cofrinhos, Mais), FAB de Nova Transação, cards empilhados, sheets em vez de modais.
- **Desktop (≥1024px):** Sidebar fixa à esquerda (igual aos prints: seções "Organização / Controle Financeiro / Visão Estratégica"), conteúdo em grid.
- Breakpoints: 390 → 768 → 1024 → 1280+.
- Estados de **loading** (skeleton) e **vazio** (ilustração + CTA) em todas as telas.

---

## 16. Reatividade & fluxo de dados

```
Supabase ──(services)──► dataStore (arrays crus reativos)
                               │
                  getters (Pinia) chamam ──► src/lib/finance (Engine pura)
                               │
                         componentes (telas) — só leem getters
```

Qualquer `insert/update/delete` passa por uma action que (1) persiste no Supabase e (2) atualiza o array em `dataStore`. Como todos os getters derivam desse array, **todas as telas recalculam automaticamente**. Não há cálculo em template além de formatação.

---

## 17. Roadmap de build (ordem para o 1º comando gerar algo funcional)

1. **Setup**: Vue+Vite+TS, Tailwind, shadcn-vue, Pinia, Router, Supabase client, tokens de tema (dark).
2. **DB**: aplicar migrations da seção 7 + seed de categorias + RLS.
3. **Auth**: login/logout/recover + guard + authStore + carregar profile/household.
4. **dataStore + services**: carregar todos os dados crus do household.
5. **Engine** (`src/lib/finance`): implementar todas as funções da 9.9 **com testes unitários** usando o exemplo da 9.5.
6. **Contas, Categorias, Transações**: CRUD + tabela + form rápido.
7. **Dashboard**: cards e gráficos lendo getters.
8. **Contas fixas + Receitas recorrentes**: CRUD → alimentam Engine.
9. **Cofrinhos**: metas + aportes → `Cr`/`R`.
10. **Cartões**: compras/parcelas/faturas → projeção e `Or`.
11. **Planejamento**: Pode Gastar detalhado + Projeção 3/6/12 + Calendário.
12. **Score + Insights**.
13. **Configurações** + polish mobile (bottom nav, FAB, skeletons, empty states).

---

## 18. Checklist de aceite da V1

- [ ] Login protege todas as rotas; os dois usuários do casal veem os **mesmos** dados (RLS por household).
- [ ] Nenhuma coluna de valor calculado no banco (exceto `goals.current_amount`).
- [ ] Toda fórmula vem de `src/lib/finance`; nenhuma tela recalcula.
- [ ] Criar/editar/excluir transação reflete **na hora** em Dashboard, Projeção, Pode Gastar, Score.
- [ ] Pode Gastar bate com o exemplo trabalhado da seção 9.5.
- [ ] Cofrinho com prazo reduz o Pode Gastar (reserva a contribuição) e o valor **sobra** no fim do mês.
- [ ] Compra parcelada 12x aparece nas próximas 12 faturas e na projeção.
- [ ] Projeção mostra meses negativos em vermelho + alerta.
- [ ] Score 0–100 com 5 critérios proporcionais e faixa textual.
- [ ] Funciona em 390px (bottom nav + FAB) e em desktop (sidebar).
- [ ] Dark mode por padrão; tema configurável.

---

## 19. Assunções e decisões em aberto

**Assunções tomadas (alinhadas com o que você respondeu):**
- Saldo de conta é **calculado** por saldo inicial + transações manuais (sem edição direta de saldo). Para "corrigir" um saldo, criar uma transação de ajuste.
- Cofrinho é **earmark/pendência**: o dinheiro continua na conta; o que muda é o cálculo reservar a contribuição mensal para sobrar no fim do mês. Aporte (`goal_contribution`) é net-neutro ao saldo (não é despesa). Se um dia você mover o dinheiro para uma conta não rastreada, registre como transferência.
- Pagamento de fatura de cartão é uma transação de despesa (categoria "Cartão"); a fatura do mês é considerada paga quando há essa transação ≥ o valor da fatura. (Modelo simples da V1; pode evoluir para um campo de status de fatura.)
- App é uma única "casa" (household). Multi-família/permissões ficam fora.

**Em aberto (decidir durante o build, default sugerido entre parênteses):**
- Incluir gasto médio (`avgVar`) na projeção por padrão? (default: **ligado**, com toggle.)
- Janela do gasto médio (default: **3 meses**).
- Score: pesos iguais (default: **20/critério**) — ajustável depois.