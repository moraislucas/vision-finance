# Vision Finance

App web (mobile-first) de controle financeiro pessoal/familiar — **prevê o futuro**,
não só registra o passado. A pergunta que o produto responde:

> "Quanto eu posso gastar hoje/essa semana/esse mês sem me ferrar no fim do mês?"

A fonte única de verdade do produto é [`VISION_FINANCE_CONTEXT.md`](./VISION_FINANCE_CONTEXT.md).
Toda decisão de regra de negócio vem da seção 9 (Engine Financeira); toda decisão
de dados vem da seção 7 (Banco de Dados). Esta docstring complementa, nunca substitui.

## Stack

Vue 3 (`<script setup>`) · TypeScript strict · Vite · Vue Router · Pinia ·
TailwindCSS + shadcn-vue · Lucide · VueUse + Motion · vee-validate + Zod ·
ECharts (`vue-echarts`) · Day.js (pt-br / America/Sao_Paulo) ·
@tanstack/vue-table · Supabase (Auth + Postgres + RLS).

## Setup local

```bash
npm install
npm run dev           # http://localhost:5173
npm run test:run      # vitest run
npm run typecheck     # vue-tsc --noEmit
```

`.env` traz as credenciais Supabase do projeto (anon key — pública por design;
RLS é quem protege os dados). Para overrides locais, use `.env.local` (gitignored).

## Banco de dados

Aplicar as migrations no SQL Editor do Supabase, em ordem:

1. `supabase/migrations/0001_init.sql` — tabelas, índices, RLS, `current_household_id()`,
   trigger que mantém `goals.current_amount` em sincronia com `goal_contributions`,
   trigger que faz seed de categorias padrão ao criar um household.
2. `supabase/migrations/0002_bootstrap_helpers.sql` — helpers de bootstrap:
   `seed_default_household()`, trigger em `auth.users` que cria profile
   automaticamente, e `bootstrap_status()`.

**Bootstrap (sem cadastro público — seção 8):**

```sql
-- 1. Cria a casa (idempotente).
select public.seed_default_household('Minha Casa');
```

2. No painel **Authentication → Users → Add user** (x2):
   - email + senha
   - ✅ Auto Confirm User
   - (opcional) User Metadata: `{"name": "Lucas"}` para personalizar o nome do profile
   - O profile é criado automaticamente pelo trigger.

```sql
-- 3. Confira o setup.
select * from public.bootstrap_status();
-- households=1, profiles=2, auth_users=2, categories=14, settings=1
```

Pronto: os dois usuários enxergam os mesmos dados via RLS.

## Estrutura

```
src/
├── lib/finance/      # ⭐ Engine pura (seção 9). NENHUMA tela recalcula.
├── services/supabase # client + um arquivo por entidade
├── stores/           # auth + data (fonte única de verdade reativa)
├── pages/            # telas (uma por rota)
├── layouts/
├── router/
├── components/       # (M6+) — ui/, dashboard/, charts/, transactions/, …
├── composables/      # (M6+)
├── lib/helpers/      # date.ts, format.ts
├── lib/constants/    # categories.ts (espelha o seed da migration)
└── types/            # domain.ts, database.ts (gerado pelo Supabase CLI)
```

## Engine financeira

Localização: `src/lib/finance/`. Funções **puras** (entrada: arrays/objetos
crus; saída: números). Não tocam Supabase nem Pinia. Mapeamento com a seção 9.9
está documentado em `src/lib/finance/index.ts`.

Smoke test do contrato (seção 9.5):

```bash
npm run test:run -- worked-example
```

Quebrou aí → o produto está errado. Não ajuste a expectativa do teste.

## Roadmap

Milestones em ordem (seção 17): **1–5 prontos** (setup + migration + auth +
dataStore + engine + testes). Próximos: contas/categorias/transações UI,
Dashboard, contas fixas, cofrinhos, cartões, planejamento, score+insights,
configurações + polish mobile.
