# CLAUDE.md — Memória do projeto Vision Finance

> **Leia este arquivo PRIMEIRO em qualquer sessão.** Ele é o estado vivo do
> projeto: o que existe, o que foi decidido e por quê, onde achar as coisas, e
> o que ainda falta. Mantenha-o atualizado conforme avançar.

## TL;DR

Vision Finance é um app web **mobile-first** de controle financeiro de uma
"household" (casal). O diferencial é **prever o futuro**, não registrar o
passado — responde "quanto eu posso gastar hoje/essa semana/esse mês sem me
ferrar no fim do mês?" e **agora também garante poupança automática** no fim
do mês via margem configurável.

## 📚 Fontes da verdade (em ordem)

1. **`VISION_FINANCE_CONTEXT.md`** (raiz) — produto/regra de negócio. Seção 9
   = engine financeira, seção 7 = schema, seção 19 = decisões em aberto/defaults.
2. **`ESTILO.MD`** (raiz) — design system completo (OKLCH, cva, layout,
   primitivos). Quando dúvida visual, consulte aqui antes de inventar.
3. **Este arquivo (`CLAUDE.md`)** — extensões/decisões pós-V1 e estado atual.

Se houver conflito, o **`VISION_FINANCE_CONTEXT.md`** vence em regra de
negócio, **`ESTILO.MD`** vence em UI, este vence em decisões mais recentes.

## 🚀 Como rodar

```bash
# Carrega Node 20 (Supabase exige >=20)
nvm use lts/iron

# Subir dev
npm run dev              # http://localhost:3000

# Validações
npm run test:run         # vitest — 48 testes da engine
npx vue-tsc --noEmit     # typecheck (TS strict)
npm run build            # smoke test de produção
```

Credenciais Supabase: `.env` (committed). A anon key é pública por design;
RLS protege os dados. Para overrides locais: `.env.local` (gitignored).

## 🗄️ Migrations aplicadas

Rode no SQL Editor do Supabase **na ordem**:

| # | Arquivo | O que faz |
|---|---|---|
| 0001 | `supabase/migrations/0001_init.sql` | Schema completo da seção 7 + RLS + trigger de seed de categorias |
| 0002 | `supabase/migrations/0002_bootstrap_helpers.sql` | `seed_default_household()` + trigger `on_auth_user_created` que cria profile automaticamente quando você adiciona usuário no painel Auth |
| 0003 | `supabase/migrations/0003_emoji_categories.sql` | Atualiza ícones de categorias padrão de nomes Lucide para emojis |
| 0004 | `supabase/migrations/0004_savings_target.sql` | Adiciona coluna `monthly_savings_target` em `settings` |

**Bootstrap inicial (uma vez):**

```sql
-- 1. Cria a household (trigger semeia categorias + settings):
select public.seed_default_household('Minha Casa');

-- 2. No painel Auth → Add user (× 2 pessoas do casal), com "Auto Confirm User".
--    Opcional em User Metadata: {"name":"Lucas"} para personalizar o profile.
--    O trigger cria o profile sozinho apontando para a única household.

-- 3. Confirma:
select * from public.bootstrap_status();
-- esperado: 1 household, 2 profiles, 2 auth_users, 14 categories, 1 settings
```

## 🧱 Stack

- **Vue 3.5** (`<script setup>` + TS strict) · **Vite 5** · **Vue Router 4** · **Pinia 2**
- **TailwindCSS 3** com tokens OKLCH em variáveis CSS (ver `src/style.css`)
- **reka-ui** (headless: Dialog/Switch/Tooltip)
- **@lucide/vue** (ícones) — *não* `lucide-vue-next` (deprecated)
- **@tanstack/vue-table** (tabela de transações)
- **vue-echarts** + módulos só do que usamos (line/pie/gauge — ver `src/lib/echarts.ts`)
- **Day.js** com locale pt-br + timezone America/Sao_Paulo (helper `src/lib/helpers/date.ts`)
- **Zod** para schemas de form, **veevalidate** instalado mas usamos validação manual via `schema.safeParse()` (Zod nativo)
- **@supabase/supabase-js** (Node ≥20)
- **Vitest** + jsdom para testes da engine

## 🧠 Princípios inegociáveis (seção 5 do contexto)

1. **Fonte única da verdade** no banco. Telas leem via `dataStore`, nunca duplicam.
2. **Nenhum valor calculado é persistido** — exceto `goals.current_amount` (mantido por trigger).
3. **Engine central única** em `src/lib/finance/`. Componentes/stores só chamam funções; nunca reimplementam fórmula.
4. **Reatividade total**: mutar uma transação atualiza Dashboard/Projeção/Saldo na hora, sem refresh.
5. **Mobile-first**: 390px primeiro, depois 768 → 1024 → 1280+.
6. **Engine pura**: funções recebem dados crus, devolvem números. Não tocam Pinia/Supabase/DOM.
7. **PT-BR na UI**; identificadores/código em inglês.

## 🧮 Engine financeira — fórmulas vigentes

**Original (seção 9.5 do contexto):**

```
B0  = saldo bancário hoje (soma das contas com include_in_available)
R   = total earmarcado em metas ativas
Ir  = receitas recorrentes que ainda vão entrar este mês
Or  = contas fixas + faturas a vencer este mês
Cr  = quanto ainda falta guardar nas metas este mês

ProjetadoFimMes = B0 + Ir − Or − Cr
SaldoLivreMes   = ProjetadoFimMes − R = (B0−R) + Ir − Or − Cr
```

**Extensão pós-V1 (margem de poupança automática):**

```
SafetyBuffer = min(monthly_savings_target, SaldoLivreMes)
PodeGastarMes = max(0, SaldoLivreMes − SafetyBuffer)
PodeGastarDia = PodeGastarMes / diasRestantes   (incluindo hoje)
```

Quando `monthly_savings_target` está setado e o `SaldoLivreMes < target`,
`PodeGastarMes` vira **R$ 0,00** e a UI mostra alerta de "mês apertado".

**Quando `monthly_savings_target = null/0`**, o comportamento é IDÊNTICO ao
do contexto seção 9.5 — todos os testes do worked example continuam válidos.

### Funções obrigatórias (seção 9.9) — todas implementadas

`getCurrentBalance` · `getAccountBalance` · `getReserved` · `getAvailableNow` ·
`getRemainingIncome` · `getRemainingObligations` · `getRemainingGoalContributions` ·
`getProjectedMonthEndBalance` · `getFreeBalanceMonth` · `getBudgetBreakdown` ·
`getDailyBudget` · `getWeeklyBudget` · `getMonthlyBudget` ·
`getGoalMonthlyTarget` · `getGoalProgress` ·
`getInstallmentDueDate` · `getCardInvoice` · `getCardAvailableLimit` ·
`getProjection` (3/6/12 meses) · `getFinancialScore` · `getInsights` ·
**`getMonthDailyProjection`** (extensão: calendário/extrato diário).

Todas aceitam `BudgetOptions = { savingsBuffer }` quando faz sentido.

### Helper crítico

`resolvePaymentCategoryId(categories)` resolve o id da categoria "Cartão"
(case/diacritic-insensitive) — passar pro `getRemainingObligations` etc.

## 🎨 Design System — decisões aplicadas

- **Tokens OKLCH** em `:root` no `src/style.css`. Para trocar a primary, edite
  3 linhas: `--primary`, `--primary-foreground`, `--ring`.
- **Cor primária atual: Apple System Blue (dark mode)** `0.66 0.21 253` ≈ `#0A84FF`.
- **Success continua verde** (independente da primary) — separação marca × status.
- **Dark mode único** — `class="dark"` fixo no `<html>`. Sem light/system.
- **Fonte: Inter** com OpenType cv11/ss01/ss03. **Nunca `font-mono`** —
  use `tabular-nums` para alinhar números.
- **Raio: `--radius: 1rem`** — cards `rounded-2xl`, botões `rounded-xl`.
- **Ease canônico: `ease-smooth`** = `cubic-bezier(.16,1,.3,1)`.
- **Animações de modal/sheet**: NÃO usar `-translate-x-1/2 -translate-y-1/2`
  pra centralizar — `tailwindcss-animate` reescreve a transform e o modal
  entra "deslocado pra direita". Centralize com **wrapper flex**.
- **`pointer-events-none` no wrapper** dos modais — o reka-ui só desmonta os
  próprios componentes; qualquer div nossa dentro do Portal fica em DOM e
  bloqueia cliques.
- **Padding-bottom de Sheet**: `pb-[calc(2rem+env(safe-area-inset-bottom))]`
  — a classe `.safe-area-bottom` sobrescreve `pb-X`, então use arbitrary
  value que SOMA.
- **Categorias usam emojis** no campo `icon` (1 grapheme), não nomes Lucide.

## 🧩 Componentes UI prontos (`src/components/ui/`)

| Componente | Uso |
|---|---|
| `Button` | cva com 7 variantes; aliases `variant="primary"`→default e `size="md"`→default mantidos pra retrocompatibilidade |
| `Card` | props `padded` (= p-5 md:p-6), `interactive`, `elevated` |
| `Badge` | cva 8 variantes + prop `color` (hex livre, ex: cor da categoria) |
| `Input` | h-11, focus com ring-primary/20 + borda primary/60 |
| `MoneyInput` | máscara `R$ 1.234,56` em tempo real; `v-model` expõe número puro |
| `Select` | nativo estilizado + ChevronDown |
| `Label` | text-xs uppercase tracking-wide |
| `Sheet` | bottom-sheet mobile, modal centralizado md+ (zoom-in); wrapper com pointer-events-none |
| `ConfirmDialog` | usado em todo delete (reseta loading no fechar via `watch(open)`) |
| `Switch` | reka-ui `SwitchRoot` — substitui todos os checkboxes |
| `ColorPicker` | paleta fixa de 10 cores do sistema |
| `Tooltip` | reka-ui Tooltip; `TooltipProvider` no `App.vue` |
| `IconButton` | botão quadrado com Tooltip obrigatório (`label`) — padronize ações de Editar/Excluir |
| `EmptyState` | bloco card-like, ícone + título + descrição + slot ação |
| `SkeletonList` / `SkeletonGrid` | loading states padrão |
| `StatusDot` | pontinho colorido com pulse opcional |
| `PageHeader` | eyebrow + título + descrição + slot `actions` — use no topo das páginas |

## 🗂️ Estrutura do projeto

```
src/
├── lib/
│   ├── finance/         ⭐ Engine pura — não toca Pinia/Supabase/DOM
│   │   ├── balance.ts        (B0, accountBalance, reserved, availableNow, round2)
│   │   ├── recurring.ts      (Ir, Or, reconciliação previsto×realizado)
│   │   ├── credit-cards.ts   (cronograma de parcelas, fatura, resolvePaymentCategoryId)
│   │   ├── goals.ts          (monthlyTarget, Cr)
│   │   ├── budget.ts         (PodeGastar + savingsBuffer)
│   │   ├── projection.ts     (3/6/12 meses)
│   │   ├── daily-projection.ts ⭐ (calendário/extrato diário)
│   │   ├── score.ts          (0-100, 5 critérios)
│   │   ├── insights.ts       (regras automáticas)
│   │   ├── types.ts          (EngineData, BudgetOptions, etc.)
│   │   ├── index.ts          (barrel)
│   │   └── __tests__/        (helpers + 8 arquivos de teste, 48 testes)
│   ├── helpers/
│   │   ├── date.ts           (dayjs com pt-br + tz SP)
│   │   └── format.ts         (formatCurrency, maskCurrencyBRL, parseCurrencyBRL)
│   ├── schemas/         (Zod schemas dos forms)
│   ├── constants/
│   │   └── categories.ts     (espelho do seed do banco — emojis)
│   ├── echarts.ts       (registro mínimo de módulos ECharts)
│   └── utils.ts         (cn() do shadcn-vue)
├── components/
│   ├── ui/              (primitivos — ver tabela acima)
│   ├── layout/          (TopBar, Sidebar com collapse, BottomNav, Logo, AppToasts, FloatingAddButton, navigation.ts)
│   ├── dashboard/       (PodeGastarCard, KpiCard, EconomiaCard, ProximasContasCard, UltimasTransacoesCard, ScoreCard, InsightsCard)
│   ├── transactions/    (TransactionForm, TransactionTable)
│   ├── accounts/        (AccountForm)
│   ├── categories/      (CategoryForm)
│   ├── recurring/       (RecurringIncomeForm, RecurringExpenseForm)
│   ├── credit-cards/    (CreditCardForm, PurchaseForm, CardSummary, CardDetail)
│   ├── goals/           (GoalCard, GoalForm, ContributionForm)
│   ├── planning/        (MonthlyView, CalendarioProjecao, DailyLedger, CalendarioFinanceiro)
│   └── charts/          (DonutCategorias, LinhaProjecao, GaugeScore)
├── pages/               (Login, ForgotPassword, Dashboard, Transactions, Accounts, Categories, RecurringBills, CreditCards, Goals, Planning, Settings)
├── layouts/             (AppLayout, AuthLayout)
├── stores/
│   ├── auth.ts          (sessão + profile + household_id)
│   ├── data.ts          ⭐ (única fonte de verdade reativa — upsertById/removeById in-place via splice/unshift)
│   ├── transactions.ts  (CRUD + filtros)
│   ├── accounts.ts      (CRUD)
│   ├── categories.ts    (CRUD + getter income/expense)
│   ├── recurring.ts     (incomes + expenses CRUD)
│   ├── creditCards.ts   (cards + purchases CRUD)
│   ├── goals.ts         (goals + contributions CRUD + recompute current_amount local)
│   └── settings.ts      (update)
├── services/supabase/   (client + 1 arquivo por entidade com list/create/update/remove)
├── composables/
│   ├── useToast.ts
│   ├── useBreakpoint.ts
│   └── useSidebar.ts    (estado collapse persistido em localStorage)
├── router/              (guard global; nomes de rota: dashboard/transactions/accounts/categories/recurring-bills/credit-cards/goals/planning/settings/login/recover)
├── types/
│   ├── domain.ts        (tipos manuais espelhando schema)
│   └── database.ts      (stub para Supabase types — substituir por `supabase gen types typescript` quando linkar)
└── main.ts
```

## 📋 Estado atual (o que está pronto)

| Marco | Status |
|---|---|
| M1: Stack + DS foundation | ✅ |
| M2: Migration única + RLS + bootstrap trigger | ✅ |
| M3: Auth (login/logout/recover) + guard | ✅ |
| M4: dataStore + services por entidade | ✅ |
| M5: Engine pura + 48 testes (worked example seção 9.5 obrigatório) | ✅ |
| M6: CRUD Contas/Categorias/Transações | ✅ |
| M7: Dashboard (KPIs + donut + score + insights) | ✅ |
| M8: Contas Fixas (mensal + anual com due_month) | ✅ |
| M9: Cofrinhos + aportes (com confirmação no toggle ativa/pausa) | ✅ |
| M10: Cartões + compras parceladas (cronograma via engine) | ✅ |
| M11: Planejamento (Pode Gastar detalhado + Projeção 3/6/12 + Visão mensal híbrida Calendário/Planilha) | ✅ |
| M12: Score (gauge) + Insights | ✅ |
| M13: Settings (margem de poupança + teto mensal + perfil) | ✅ |
| **Pós-V1** | |
| DS aplicado conforme `ESTILO.MD` (Apple Blue, OKLCH, Inter, emojis, tooltips, Switch, ColorPicker, MoneyInput) | ✅ |
| Calendário diário híbrido (CalendarioProjecao + DailyLedger num MonthlyView com tab) | ✅ |
| Margem de poupança automática (`monthly_savings_target`) | ✅ |
| Máscara BRL nos campos R$ | ✅ |
| Login centralizado via flex + min-w-500 no desktop | ✅ |

## ⚠️ Decisões com armadilha (não esquecer)

### 1. Reatividade do dataStore
`upsertById` e `removeById` em `src/stores/data.ts` mutam o array **in-place**
(`splice`/`unshift`). Callers passam o array direto: `data.upsertById(data.transactions, item)` — **nunca** `{ value: data.transactions }` (era o bug original que travava a UI).

### 2. Modal com `tailwindcss-animate`
**Não use `-translate-x-1/2 -translate-y-1/2`** para centralizar `DialogContent`.
A transform da animação `enter`/`exit` é SUBSTITUTIVA, então o modal entra
com offset. Centralize via wrapper flex (com `pointer-events-none`). Veja
`src/components/ui/Sheet.vue` e `ConfirmDialog.vue` como referência.

### 3. `.safe-area-bottom` × `pb-X`
A classe `.safe-area-bottom` define `padding-bottom: env(...)` — sobrescreve
qualquer `pb-X` do Tailwind. Para SOMAR safe area + padding, use:
```html
class="pb-[calc(2rem+env(safe-area-inset-bottom))]"
```

### 4. Reka-ui Portal não desmonta divs nossas
Qualquer `<div>` dentro de `<DialogPortal>` fica em DOM mesmo com `open=false`
(reka-ui só gerencia presence dos próprios componentes). Sempre adicione
`pointer-events-none` no wrapper + `pointer-events-auto` no `DialogContent`.

### 5. Daily projection desconta HOJE também
Em `getMonthDailyProjection`, o `dailyBudget` é descontado também no dia de
hoje (não só no futuro). Para hoje: `projectedSpend = max(0, dailyBudget - varRealizadoHoje)`.
Isso garante que o `endBalance` do último dia bata com o `freeBalanceMonth`
do `getBudgetBreakdown`.

### 6. Margem de poupança vs metas
São coisas **diferentes**:
- **Metas/Cofrinhos** (`goals` + `goal_contributions`): cada meta tem sua
  própria pendência (Cr) e seu próprio reservado (R). O Pode Gastar desconta
  as duas.
- **Margem de poupança automática** (`settings.monthly_savings_target`):
  um valor que SEMPRE deve sobrar como "respiro", além das metas. É opcional.

### 7. Node ≥ 20
Supabase SDK exige Node 20+. Use `nvm use lts/iron` (há `.nvmrc` no projeto).

### 8. Supabase client é untyped
`src/services/supabase/index.ts` exporta `SupabaseClient` sem o generic
`<Database>` porque o stub manual de tipos não satisfaz a v2.106+ (precisa
de `__InternalSupabase`/`Enums`/`CompositeTypes`). Quando linkar o projeto
real e rodar `npm run supabase:types`, troque para `SupabaseClient<Database>`
e ganhe tipagem completa em `from()`/`insert()`.

### 9. Categorias usam `icon` para emoji, não nome Lucide
O campo `categories.icon` agora carrega emoji (1 grapheme). Renderização:
```html
<span class="text-lg">{{ category.icon || '🏷️' }}</span>
```

### 10. AuthLayout centraliza via flex
**Não** adicionar `mt-*`/`py-*`/`max-w-*`/`mx-auto` na página do Login —
o AuthLayout já cuida disso com `flex items-center justify-center` no
container + `md:min-w-[500px]` no wrapper do RouterView. O Login só cuida
do layout interno (`space-y-8 animate-fade-in-up`).

## 🧪 Testes

`npm run test:run` deve sempre passar **48/48**.

O teste **`worked-example.test.ts`** é o canário do contrato (seção 9.5
literal). Se ele quebrar, NÃO ajuste o `expect()` — o produto está errado.

Os testes da daily projection cobrem:
- Mês atual com nada acontecendo (dailyBudget descontado em hoje + futuro)
- Passado com transações reais
- Futuro com recorrentes
- Navegação para mês futuro
- `savingsBuffer` reduzindo o `dailyBudget` e garantindo sobra

## 🚧 Pendências / próximos passos

- [ ] Aplicar `supabase gen types typescript --linked > src/types/database.ts`
      e voltar o client a usar generic `<Database>` (typecheck mais forte)
- [ ] Code-splitting do ECharts (~890 KB no bundle, dominado por ele)
- [ ] Realtime do Supabase (`supabase.channel`) para sincronizar entre os
      2 usuários da household automaticamente
- [ ] Skeleton refinado nas páginas — hoje SkeletonList/Grid existem mas
      poderiam ser usadas em mais lugares
- [ ] Drag-to-close no Sheet mobile (polish de UX)
- [ ] Visão "Horizonte de saldos" 3 meses lado a lado (imagem 3 dos exemplos
      do usuário) — não implementada
- [ ] Considerar `getMonthDailyProjection` cobrindo aportes a metas como
      eventos visuais no calendário (hoje só passados aparecem; aportes
      futuros previstos não)

## 🧠 Como atualizar este arquivo

Quando finalizar uma sessão grande:
1. Adicione novas migrations na tabela "Migrations aplicadas".
2. Marque marcos como ✅ na tabela "Estado atual".
3. Documente decisões com armadilha em "Decisões com armadilha".
4. Mova itens de "Pendências" para o histórico quando completar.

Esse arquivo é seu MAIS do que do produto — escreva pra você-do-futuro.
