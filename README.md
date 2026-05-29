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
nvm use lts/iron      # Node ≥ 20 (Supabase SDK exige)
npm install
cp .env.example .env  # depois preencha VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY
npm run dev           # http://localhost:3000
npm run test:run      # vitest run (48 testes)
npm run typecheck     # vue-tsc --noEmit
```

`.env` é gitignored — cada dev/ambiente preenche o próprio. A anon key
Supabase é pública por design (RLS protege os dados).

## Deploy na Vercel

`vercel.json` já configurado: framework Vite, build `npm run build`, output `dist`,
**rewrite SPA** (para o Vue Router não dar 404 ao refresh em rotas internas)
e cache `immutable` em `/assets/*`.

### Passos no dashboard Vercel

1. **Connect repository** — escolha `moraislucas/vision-finance`.
2. **Framework Preset** — `Vite` (auto-detecta).
3. **Environment Variables** — adicione em *Production* (e *Preview* se quiser
   builds de PR):

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://<seu-projeto>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | a JWT anon key do painel Supabase |

4. **Deploy**.

### Pós-deploy: liberar o domínio Vercel no Supabase

No painel Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://<seu-projeto>.vercel.app` (ou seu domínio custom)
- **Redirect URLs**: adicione tanto `https://<seu-projeto>.vercel.app/**` quanto
  `http://localhost:3000/**` para que o link de recuperação de senha redirecione
  certo em produção e em dev.

Sem isso, o e-mail de "recuperar senha" tenta voltar para `localhost` mesmo em prod.

## Banco de dados

Aplicar as migrations no SQL Editor do Supabase, em ordem:

1. `supabase/migrations/0001_init.sql` — tabelas, índices, RLS, `current_household_id()`,
   trigger que mantém `goals.current_amount` em sincronia com `goal_contributions`,
   trigger que faz seed de categorias padrão ao criar um household.
2. `supabase/migrations/0002_bootstrap_helpers.sql` — helpers de bootstrap:
   `seed_default_household()`, trigger em `auth.users` que cria profile
   automaticamente, e `bootstrap_status()`.
3. `supabase/migrations/0003_emoji_categories.sql` — converte ícones Lucide
   das categorias padrão em emojis (e atualiza o seed pra novas households).
4. `supabase/migrations/0004_savings_target.sql` — adiciona a coluna
   `monthly_savings_target` em `settings` para a margem de poupança automática.

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

V1 (M1–M13 da seção 17) **concluída**: setup + migration + auth + dataStore
+ engine + testes + Contas/Categorias/Transações + Dashboard + Contas Fixas
+ Cofrinhos + Cartões + Planejamento + Score/Insights + Settings.

Pós-V1 entregue: design system aplicado (Apple Blue / OKLCH / Inter / emojis),
calendário diário híbrido com visão Calendário + Planilha, margem de poupança
automática, máscara BRL em inputs de valor.

Próximos passos sugeridos em [`CLAUDE.md`](./CLAUDE.md): supabase type-gen,
code-splitting do ECharts, realtime via Supabase channels, skeletons em mais
páginas, drag-to-close no Sheet mobile.
