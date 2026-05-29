# Vision Finance

App web (mobile-first) de controle financeiro pessoal/familiar — **prevê o futuro**,
não só registra o passado. A pergunta que o produto responde:

> "Quanto eu posso gastar hoje/essa semana/esse mês sem me ferrar no fim do mês?"

## Stack

Vue 3 (`<script setup>`) · TypeScript strict · Vite · Vue Router · Pinia ·
TailwindCSS · reka-ui · @lucide/vue · VueUse · vee-validate + Zod ·
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
Supabase é pública por design (RLS é quem protege os dados).

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

## Estrutura

```
src/
├── lib/finance/      # ⭐ Engine pura. NENHUMA tela recalcula nada.
├── services/supabase # client + um arquivo por entidade
├── stores/           # auth + data (fonte única de verdade reativa)
├── pages/            # telas (uma por rota)
├── layouts/
├── router/
├── components/       # ui/, layout/, dashboard/, charts/, transactions/, planning/...
├── composables/
├── lib/helpers/      # date.ts (Day.js pt-br/SP), format.ts (BRL)
├── lib/constants/
└── types/
```

## Engine financeira

Localização: `src/lib/finance/`. Funções **puras** (entrada: arrays/objetos
crus; saída: números). Não tocam Supabase nem Pinia. Mapeamento das funções
em `src/lib/finance/index.ts`.

Smoke test do contrato:

```bash
npm run test:run -- worked-example
```

48 testes cobrem balance, recurring, credit-cards, goals, projection, score,
daily-projection e o **worked example** canônico. Quebrou aí → o produto está
errado. Não ajuste a expectativa do teste.

## Status

**V1 concluída** — Login, Dashboard com Pode Gastar + KPIs + Score + Insights,
CRUDs (Contas, Categorias, Transações, Contas Fixas, Cofrinhos, Cartões com
cronograma de parcelas), Planejamento com projeção 3/6/12 meses + visão mensal
híbrida (Calendário + Planilha), Settings com margem de poupança automática.

Design system aplicado (Apple Blue / OKLCH / Inter / emojis em categorias),
máscara BRL em todos os inputs de valor, dark mode único.
