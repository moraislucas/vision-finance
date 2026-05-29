# Estilo.md — Guia de Design do Fut de Quinta

Guia completo do layout, design system, padrões e estilo desta aplicação, para replicar o visual em outro projeto.

> **Filosofia:** mobile-first · dark mode único (sem light) · premium/minimalista (Notion/Apple/Nubank/Linear/Raycast). Cantos arredondados generosos, glassmorphism, animações suaves, indicadores de status semafóricos.

> **Objetivo desta réplica:** manter **exatamente** este design system no outro projeto, **trocando apenas a primary color**. Tudo abaixo deve ser copiado como está — só a cor de marca muda (ver seção 0).

---

## 🤖 Instruções para a IA (leia primeiro)

**Você (IA) está lendo este arquivo dentro de um projeto NOVO, de segmento diferente.** Sua tarefa é recriar **a mesma roupagem visual** (este design system) neste projeto, sem trazer regras de negócio do sistema de origem.

**O que recriar (o "estilo"):**
- Os 5 arquivos-base da seção 🚀 Quickstart (config + CSS + utils + HTML), copiados **verbatim**.
- Os componentes UI primitivos (`src/components/ui/`) com as **mesmas variantes cva** das seções 10.
- As convenções de layout, tipografia, espaçamento, animação e composição de página (seções 3–12).

**O que NÃO trazer (não é "estilo"):**
- ❌ Autenticação, Supabase, stores de domínio, services de API, tipos de banco.
- ❌ Rotas/telas específicas do sistema de origem (Jogos, Jogadores, Financeiro…).
- ❌ Regras de negócio, enums de domínio, lógica de pagamento/presença.
- ✅ Reaproveite apenas: `cn()`, `useBreakpoint`, os componentes `ui/`, os componentes de `layout/` (Sidebar/TopBar/BottomNav/PageHeader) **adaptando os itens de nav** ao novo domínio.

**Ordem de execução recomendada:**
1. Instalar deps (Quickstart §A) e criar os arquivos-base (§B–§F) verbatim.
2. Decidir a primary color do novo projeto e aplicar **só** as 3 variáveis da seção 0.
3. Criar `src/lib/utils.ts` (`cn`) → criar os componentes `ui/` usando a **Anatomia** (§10.0) como molde e as variantes de cada um (§10).
4. Montar `layout/` (seção 11), trocando `navigation.ts` pelos destinos do novo domínio.
5. Construir as telas do novo projeto usando os padrões de composição (seção 12).

**Regra de ouro:** se algo não estiver descrito aqui, **siga o princípio mais próximo das seções 1–14**, não invente um estilo novo. A meta é que o sistema Y seja visualmente indistinguível do X, exceto pela cor de marca e pelo conteúdo.

---

## 🚀 Quickstart — montar o DS do zero

Projeto-base: **Vite + Vue 3 + TS + Tailwind 3**. Se o stack do novo projeto for outro (React, Svelte…), traduza os componentes mas mantenha **idênticos** o `tailwind.config`, o `main.css` (variáveis OKLCH + utilitários) e as classes — é aí que mora o visual.

### A. Instalar dependências

```bash
# runtime do DS
npm i class-variance-authority clsx tailwind-merge tailwindcss-animate \
      lucide-vue-next @vueuse/core reka-ui

# build (se ainda não tiver)
npm i -D tailwindcss@^3 postcss autoprefixer
```

> `reka-ui` só é necessário para componentes headless (Modal/Collapsible/Select avançado). `@vueuse/core` cobre `useBreakpoint`. Em stack não-Vue, troque pelos equivalentes.

### B. `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### C. `tailwind.config.js` (copiar inteiro)

```js
/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'oklch(var(--success) / <alpha-value>)',
          foreground: 'oklch(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
          foreground: 'oklch(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'oklch(var(--info) / <alpha-value>)',
          foreground: 'oklch(var(--info-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.4), 0 0 0 1px rgb(255 255 255 / 0.04)',
        glow: '0 0 0 1px oklch(var(--border)), 0 8px 24px -8px rgb(0 0 0 / 0.6)',
        elevated: '0 12px 32px -12px rgb(0 0 0 / 0.7), 0 0 0 1px oklch(var(--border))',
        'primary-glow': '0 0 24px -4px oklch(var(--primary) / 0.4)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s infinite',
      },
      transitionTimingFunction: { smooth: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [animate],
}
```

### D. `src/assets/styles/main.css` (copiar inteiro — o coração do tema)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* OKLCH components — Tailwind aplica alpha via oklch(var(--x) / <alpha>) */
    --background: 0.145 0 0;
    --foreground: 0.985 0 0;

    --card: 0.185 0 0;
    --card-foreground: 0.985 0 0;

    --popover: 0.185 0 0;
    --popover-foreground: 0.985 0 0;

    --secondary: 0.22 0 0;
    --secondary-foreground: 0.985 0 0;

    --muted: 0.205 0 0;
    --muted-foreground: 0.66 0.005 270;

    --accent: 0.24 0 0;
    --accent-foreground: 0.985 0 0;

    --border: 0.255 0 0;
    --input: 0.255 0 0;

    /* Brand — TROCAR estas 3 para mudar a marca (ver seção 0) */
    --primary: 0.78 0.18 145;
    --primary-foreground: 0.13 0 0;
    --ring: 0.78 0.18 145;

    /* Semantic */
    --success: 0.78 0.18 145;
    --success-foreground: 0.13 0 0;

    --warning: 0.78 0.16 75;
    --warning-foreground: 0.13 0 0;

    --destructive: 0.65 0.22 25;
    --destructive-foreground: 0.985 0 0;

    --info: 0.7 0.16 245;
    --info-foreground: 0.985 0 0;

    --radius: 1rem;
  }

  .dark { color-scheme: dark; }

  * { border-color: oklch(var(--border)); }

  html, body, #app { height: 100%; }

  body {
    background-color: oklch(var(--background));
    color: oklch(var(--foreground));
    font-feature-settings: 'cv11', 'ss01', 'ss03';
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background-color: oklch(var(--primary) / 0.3);
    color: oklch(var(--foreground));
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background-color: oklch(var(--border));
    border-radius: 9999px;
    border: 2px solid oklch(var(--background));
  }
  ::-webkit-scrollbar-thumb:hover { background-color: oklch(0.32 0 0); }
}

@layer components {
  .surface {
    background-color: oklch(var(--card));
    border: 1px solid oklch(var(--border));
    border-radius: 1rem;
  }
  .glass {
    background-color: oklch(var(--background) / 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid oklch(var(--border) / 0.6);
  }
  .hairline { border-top: 1px solid oklch(var(--border) / 0.6); }
  .grid-pattern {
    background-image:
      linear-gradient(to right, oklch(var(--border) / 0.5) 1px, transparent 1px),
      linear-gradient(to bottom, oklch(var(--border) / 0.5) 1px, transparent 1px);
    background-size: 32px 32px;
  }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }
  .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-area-top { padding-top: env(safe-area-inset-top); }
}
```

> Importe esse CSS uma única vez no entrypoint: `import './assets/styles/main.css'` no `main.ts`.

### E. `index.html` (esqueleto — troque só o título/descrição/lang se preciso)

```html
<!doctype html>
<html lang="pt-BR" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#0A0A0A" />
    <meta name="color-scheme" content="dark" />
    <meta name="description" content="{{DESCRIÇÃO DO NOVO SISTEMA}}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>{{NOME DO NOVO SISTEMA}}</title>
  </head>
  <body class="bg-background text-foreground antialiased">
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### F. `src/lib/utils.ts` (o `cn()` que todo componente usa)

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### G. Estrutura de pastas a recriar (só a camada de estilo/UI)

```
src/
├── assets/styles/main.css   # §D — tema (OKLCH + utilitários)
├── lib/utils.ts             # §F — cn()
├── composables/
│   └── useBreakpoint.ts     # seção 8
├── components/
│   ├── ui/                  # seção 10 — primitivos (Button, Card, Badge, Input…)
│   └── layout/              # seção 11 — Sidebar, TopBar, BottomNav, PageHeader, navigation.ts
└── layouts/                 # seção 11 — AppLayout, AuthLayout
```

> **Não recrie** `services/`, `stores/` de domínio, `types/database.ts`, `middleware/`, nem as `views/` do sistema de origem. Essas são do negócio, não do estilo.

---

## 0. 🎯 O que trocar para mudar a primary (ÚNICA coisa que muda)

Toda a marca vive em **3 variáveis CSS** no `:root` (formato OKLCH = `Lightness Chroma Hue`). Para trocar a cor primária, edite **apenas** estas linhas — o resto do DS fica idêntico:

```css
:root {
  --primary: 0.78 0.18 145;          /* ← TROCAR: cor de marca (verde hoje) */
  --primary-foreground: 0.13 0 0;    /* ← TROCAR p/ #fff (0.985 0 0) se a primary for escura */
  --ring: 0.78 0.18 145;             /* ← TROCAR: igualar ao novo --primary */
}
```

**⚠️ Pegadinha importante deste sistema:** hoje `--success` é **o mesmo verde** que `--primary` (`0.78 0.18 145`). Decida o que quer:

- **Quer marca = sucesso (igual hoje)?** → troque também `--success` para o mesmo valor da nova `--primary`. (Faz sentido se a nova cor ainda for um verde/positivo.)
- **Quer separar marca de status?** → **deixe `--success` no verde** (`0.78 0.18 145`) e mude só `--primary`/`--ring`. Assim os status semafóricos (verde=ok) continuam corretos e a marca fica independente.

**`--primary-foreground`** é o texto que fica *em cima* do botão primário. Regra: cor primária clara → foreground escuro (`0.13 0 0`); cor primária escura/saturada → foreground branco (`0.985 0 0`). Cheque o contraste do texto do botão default.

**Exemplos de OKLCH prontos** (cole no lugar de `--primary` e `--ring`):

| Cor | Valor OKLCH (`L C H`) | foreground sugerido |
|---|---|---|
| Azul (Linear/Nubank-ish) | `0.62 0.19 264` | `0.985 0 0` (branco) |
| Roxo | `0.58 0.22 295` | `0.985 0 0` (branco) |
| Laranja | `0.70 0.19 50` | `0.13 0 0` (escuro) |
| Vermelho/rosa | `0.62 0.24 18` | `0.985 0 0` (branco) |
| Ciano/teal | `0.72 0.13 195` | `0.13 0 0` (escuro) |
| Amarelo (ouro) | `0.85 0.17 90` | `0.13 0 0` (escuro) |

> Não precisa decorar OKLCH: pegue qualquer HEX e converta em [oklch.com](https://oklch.com). Só **não** mude o resto da paleta (background/card/border/muted) nem os outros tons semânticos — é isso que mantém o "mesmo estilo".

**Onde a primary aparece automaticamente** (não precisa editar nada disso, herdam da variável): botão `variant="default"` (`bg-primary` + `shadow-primary-glow` no hover), foco de inputs (`ring-primary/20`, borda `primary/60`), Badge `variant="primary"`, links, item ativo de nav (indireto), `--ring` (anel de foco global). Trocar as 3 variáveis propaga para todos eles.

---

## 1. Stack relevante (versões)

```
vue                    ^3.5.12      (Composition API, <script setup lang="ts">)
vue-router             ^4.4.5
tailwindcss            ^3.4.13
class-variance-authority ^0.7.0     (cva — variantes de componente)
clsx                   ^2.1.1
tailwind-merge         ^2.5.4
tailwindcss-animate    ^1.0.7
reka-ui                ^1.0.0-alpha.10  (base headless)
lucide-vue-next        ^0.453.0     (ícones)
@vueuse/core           ^11.1.0      (composables)
pinia                  ^2.2.4
```

Helper de classes (`src/lib/utils.ts`):

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

> `cn()` resolve conflitos de classes Tailwind (a última vence). Usado em **todos** os componentes para mesclar classes base + variantes + `props.class`.

---

## 2. Cores (sistema OKLCH)

Todas as cores são definidas como variáveis CSS em formato **OKLCH** (perceptualmente uniforme, fácil controle de alpha). No Tailwind elas são mapeadas como `oklch(var(--x) / <alpha-value>)`, o que habilita opacidade por classe (`bg-primary/10`, `border-success/25`, etc.).

```css
:root {
  /* Base neutra */
  --background: 0.145 0 0;            /* cinza muito escuro (~#1a1a1a) */
  --foreground: 0.985 0 0;           /* quase branco */
  --card: 0.185 0 0;                 /* levemente mais claro que o bg */
  --card-foreground: 0.985 0 0;
  --popover: 0.185 0 0;
  --popover-foreground: 0.985 0 0;
  --secondary: 0.22 0 0;             /* inputs / botões secundários */
  --secondary-foreground: 0.985 0 0;
  --muted: 0.205 0 0;
  --muted-foreground: 0.66 0.005 270;/* cinza dim azulado (texto auxiliar) */
  --border: 0.255 0 0;
  --input: 0.255 0 0;
  --accent: 0.24 0 0;
  --accent-foreground: 0.985 0 0;

  /* Marca — verde esportivo premium */
  --primary: 0.78 0.18 145;
  --primary-foreground: 0.13 0 0;    /* texto escuro sobre o primary */
  --ring: 0.78 0.18 145;             /* cor do focus ring */

  /* Semânticas */
  --success: 0.78 0.18 145;          /* = primary (verde) */
  --success-foreground: 0.13 0 0;
  --warning: 0.78 0.16 75;           /* amarelo/laranja */
  --warning-foreground: 0.13 0 0;
  --destructive: 0.65 0.22 25;       /* vermelho */
  --destructive-foreground: 0.985 0 0;
  --info: 0.7 0.16 245;              /* azul */
  --info-foreground: 0.985 0 0;

  --radius: 1rem;
}
```

**Cores nomeadas por propósito, não por matiz** — sempre use `primary`, `success`, `warning`, `destructive`, `info`, `muted`. Padrão de uso para "chips"/badges/cards de status:

- Fundo suave: `bg-{tone}/10` (ou `/[0.06]`)
- Borda: `border-{tone}/25` (ou `/15`)
- Texto/ícone: `text-{tone}`

**Status semafórico:** verde = confirmado+pago · amarelo = confirmado+pendente · vermelho = faltou/inadimplente · azul = informativo.

---

## 3. Tipografia

**Fonte:** Inter (com fallbacks SF Pro / Geist / system).

```js
fontFamily: {
  sans: ['Inter', 'SF Pro Display', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
}
```

Import no `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
```

**Pesos usados:** 300, 400, 500, 600, 700, 800. Predominam `font-medium` (500) e `font-semibold` (600).

**Refino OpenType da Inter** (aplicado no `body`):

```css
font-feature-settings: 'cv11', 'ss01', 'ss03';
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Tamanho custom:** `text-2xs` = `0.6875rem` (11px). Usado em badges e labels minúsculos.

**Escala típica por contexto:**
- Título de página: `text-2xl md:text-3xl font-semibold tracking-tight`
- Valor de métrica: `text-xl md:text-2xl font-semibold tracking-tight tabular-nums`
- Label de campo: `text-xs font-medium text-muted-foreground tracking-wide uppercase`
- Eyebrow/overline: `text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium`
- Texto auxiliar: `text-xs text-muted-foreground`

> Sempre `tabular-nums` em números (métricas, valores, contadores) para alinhamento.

---

## 4. Raio, espaçamento e container

**Border radius** baseado em `--radius: 1rem`:

```js
borderRadius: {
  sm: 'calc(var(--radius) - 4px)',   /* 12px — botões, inputs */
  md: 'calc(var(--radius) - 2px)',   /* 14px */
  lg: 'var(--radius)',               /* 16px — cards, modais */
  xl: 'calc(var(--radius) + 4px)',   /* 20px */
  '2xl': 'calc(var(--radius) + 8px)',/* 24px — elementos grandes/cards */
}
```

**Container:**
```js
container: { center: true, padding: '1rem', screens: { '2xl': '1400px' } }
```

**Espaçamento (múltiplos de 4px):**
- Padding de página: `px-4 py-6` → `md:px-6 md:py-8` → `lg:px-8`
- Gap entre cards/seções: `gap-3 md:gap-4` (12px → 16px)
- Padding interno de Card: `p-5 md:p-6`
- Largura máxima do conteúdo: `max-w-7xl mx-auto`

---

## 5. Sombras e blur

```js
boxShadow: {
  soft:           '0 1px 2px 0 rgb(0 0 0 / 0.4), 0 0 0 1px rgb(255 255 255 / 0.04)',
  glow:           '0 0 0 1px oklch(var(--border)), 0 8px 24px -8px rgb(0 0 0 / 0.6)',
  elevated:       '0 12px 32px -12px rgb(0 0 0 / 0.7), 0 0 0 1px oklch(var(--border))',
  'primary-glow': '0 0 24px -4px oklch(var(--primary) / 0.4)',
}
backdropBlur: { xs: '2px' }
```

- `shadow-soft` — botões primários em repouso
- `shadow-primary-glow` — botão primário em hover (brilho verde)
- `shadow-elevated` — modais, toasts, cards destacados
- `backdrop-blur-xl` (20px) — TopBar, Sidebar, BottomNav, backdrop de modal (efeito vidro)

---

## 6. Animações e transições

```js
keyframes: {
  'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
  'fade-in-up': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
  'scale-in':   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
  shimmer:      { '100%': { transform: 'translateX(100%)' } },
}
animation: {
  'fade-in':    'fade-in 0.2s ease-out',
  'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  'scale-in':   'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
  shimmer:      'shimmer 1.6s infinite',
}
transitionTimingFunction: {
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',  /* classe: ease-smooth */
}
```

- **`ease-smooth`** é o easing padrão de quase toda transição.
- Durações comuns: `duration-200` (interações), `duration-300` (layout/sidebar), `duration-150` (saída).
- Feedback de toque: `active:scale-[0.98]` em botões, `active:scale-[0.995]` em cards.
- Plugin `tailwindcss-animate` habilitado.

---

## 7. Utilitários customizados (CSS)

Definidos em `@layer components`:

```css
.surface {
  background-color: oklch(var(--card));
  border: 1px solid oklch(var(--border));
  border-radius: 1rem;
}
.glass {
  background-color: oklch(var(--background) / 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid oklch(var(--border) / 0.6);
}
.hairline { border-top: 1px solid oklch(var(--border) / 0.6); }
.grid-pattern {
  background-image:
    linear-gradient(to right,  oklch(var(--border) / 0.5) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(var(--border) / 0.5) 1px, transparent 1px);
  background-size: 32px 32px;
}
.text-balance { text-wrap: balance; }
.text-pretty  { text-wrap: pretty; }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-area-top    { padding-top: env(safe-area-inset-top); }
```

---

## 8. Breakpoints e responsividade

Tailwind padrão: `sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`. **`lg` (1024px)** é o ponto de virada layout mobile↔desktop.

Composable `useBreakpoint` (`src/composables/useBreakpoint.ts`):

```typescript
import { useMediaQuery } from '@vueuse/core'

export function useBreakpoint() {
  const isMobile  = useMediaQuery('(max-width: 767px)')
  const isTablet  = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return { isMobile, isTablet, isDesktop }
}
```

**Padrões de responsividade:**
- Desktop only: `hidden lg:flex` / `hidden lg:block`
- Mobile only: `lg:hidden`
- Grids: `grid-cols-2 lg:grid-cols-4` (métricas), `grid-cols-1 lg:grid-cols-3` (seções)
- Safe areas: `safe-area-top` / `safe-area-bottom` em barras fixas

---

## 9. HTML raiz (`index.html`)

```html
<html lang="pt-BR" class="dark">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#0A0A0A" />
    <meta name="color-scheme" content="dark" />
    ...
  </head>
  <body class="bg-background text-foreground antialiased">
    <div id="app"></div>
  </body>
</html>
```

- `class="dark"` fixo no `<html>` — dark mode único.
- `maximum-scale=1.0, user-scalable=no` evita auto-zoom de inputs no iOS.
- `viewport-fit=cover` habilita as safe areas (notch).

---

## 10. Componentes UI (`src/components/ui/`)

Estilo shadcn-like: cada primitivo usa `cva` para variantes + `cn()` para merge. Abaixo as definições de variantes (copiáveis direto).

### 10.0 Anatomia de um componente (molde a replicar)

**Todo primitivo segue este formato.** Use o `Button.vue` completo abaixo como gabarito: `cva` define as variantes, `VariantProps` tipa as props, `withDefaults` aplica defaults, `cn()` mescla `props.class`. Replique essa mesma estrutura para os demais componentes — só muda o conteúdo do `cva` (das subseções seguintes) e o `<template>`.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-primary-glow',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        outline: 'border border-border bg-transparent text-foreground hover:bg-accent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 text-sm rounded-xl [&_svg]:size-4',
        sm: 'h-8 px-3 text-xs rounded-lg [&_svg]:size-3.5',
        lg: 'h-12 px-6 text-base rounded-2xl [&_svg]:size-5',
        xl: 'h-14 px-7 text-base rounded-2xl [&_svg]:size-5',
        icon: 'size-10 rounded-xl [&_svg]:size-4',
        'icon-sm': 'size-8 rounded-lg [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    as?: 'button' | 'a'
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    class?: any
  }>(),
  { variant: 'default', size: 'default', as: 'button', type: 'button', disabled: false, loading: false },
)

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
)
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :class="classes"
    :aria-busy="loading || undefined"
  >
    <span
      v-if="loading"
      class="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
```

> As subseções abaixo trazem **só o `cva` / classes-base** de cada componente — embrulhe cada um no mesmo esqueleto `<script setup>` + `cn(...)` + `<template>` mostrado aqui.

### Button (variantes)

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-primary-glow',
        secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        ghost:       'text-foreground hover:bg-accent hover:text-accent-foreground',
        outline:     'border border-border bg-transparent text-foreground hover:bg-accent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success:     'bg-success text-success-foreground hover:bg-success/90',
        link:        'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:   'h-10 px-4 text-sm rounded-xl [&_svg]:size-4',
        sm:        'h-8 px-3 text-xs rounded-lg [&_svg]:size-3.5',
        lg:        'h-12 px-6 text-base rounded-2xl [&_svg]:size-5',
        xl:        'h-14 px-7 text-base rounded-2xl [&_svg]:size-5',
        icon:      'size-10 rounded-xl [&_svg]:size-4',
        'icon-sm': 'size-8 rounded-lg [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)
```
Props extras: `as` (`'button' | 'a'`), `loading` (mostra spinner), `disabled`.

### Card

```typescript
cn(
  'rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 ease-smooth',
  padded && 'p-5 md:p-6',
  elevated && 'shadow-elevated',
  interactive && 'hover:border-border/80 hover:bg-card/80 cursor-pointer active:scale-[0.995]',
)
```
Props: `interactive`, `elevated`, `padded` (default `true`).

### Badge

```typescript
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-secondary text-foreground',
        muted:   'border-transparent bg-muted text-muted-foreground',
        primary: 'border-primary/25 bg-primary/10 text-primary',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/25 bg-warning/10 text-warning',
        danger:  'border-destructive/25 bg-destructive/10 text-destructive',
        info:    'border-info/25 bg-info/10 text-info',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
```
Prop `dot`: exibe pontinho colorido conforme variante.

### Input / Textarea / Select

```typescript
// Input — h-11
'flex h-11 w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50'
// invalid:
'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20'
```
- **Textarea:** mesma base, `py-2.5`, `resize-y`, `rows` default 3.
- **Select:** mesma base + `appearance-none pr-10` e `ChevronDown` absoluto à direita.
- Padrão de foco em toda a app: `focus-visible:ring-2 ring-primary/20` + borda vira `primary/60`.

### Label

```typescript
cn('text-xs font-medium text-muted-foreground tracking-wide uppercase', props.class)
```

### Modal

- Teleport com backdrop `fixed inset-0 z-50 bg-background/70 backdrop-blur-md`.
- Container: `flex items-end md:items-center justify-center` → **bottom sheet no mobile**, **modal central no desktop**.
- Conteúdo: `w-full bg-card border border-border shadow-elevated flex flex-col max-h-[90svh]`, `rounded-t-3xl` (mobile) / `rounded-2xl` (desktop).
- Tamanhos: `sm` (`max-w-sm`), `md` (`max-w-lg`), `lg` (`max-w-2xl`).
- Header/footer com `border-border/60`; footer com `bg-background/30`.
- Transições: backdrop fade `duration-200`; dialog `scale-[0.98]` (desktop) / `translate-y-2` (mobile).

### Separator
`cn('shrink-0 bg-border', horizontal ? 'h-px w-full' : 'h-full w-px')`

### Skeleton (shimmer)

```typescript
cn(
  'relative overflow-hidden bg-secondary/60',
  'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.06] after:to-transparent',
  variant === 'rect' && 'rounded-lg',
  variant === 'text' && 'rounded-md h-3.5',
  variant === 'circle' && 'rounded-full',
)
```

### StatusDot

```typescript
const tones = {
  primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning',
  danger: 'bg-destructive', info: 'bg-info', muted: 'bg-muted-foreground',
}
const sizes = { sm: 'size-1.5', md: 'size-2' }
```
Prop `pulse`: span interno com `animate-ping opacity-60`.

### StatusMenu (dropdown com tom por opção)
Trigger em forma de pílula (`rounded-full border`), 8 tons de cor, detecta se abre acima/abaixo, opções com `label` + `tone` + `description` opcional. Item selecionado: `bg-secondary/60`.

### Avatar
Tamanhos `xs size-6` · `sm size-8` · `md size-10` (default) · `lg size-12` · `xl size-16`. Fallback com iniciais (`initials(name)`).

### Collapsible
`rounded-2xl border border-border bg-card overflow-hidden`; header `hover:bg-secondary/40`, chevron rotaciona 180°; conteúdo anima via `grid-rows-[0fr→1fr]`.

### ConfirmDialog
Wrapper de Modal; props `tone` (`default | danger`), `confirmLabel`, `cancelLabel`; reseta `loading` ao fechar (via `watch(open)`).

### Toast (ToastContainer)
Posição: mobile `top-4 right-4 left-4`, desktop `bottom-4 right-4`. Card: `rounded-xl border bg-card shadow-elevated px-4 py-3 max-w-sm`. Tons success/danger/info com `border-{tone}/30 bg-{tone}/10 text-{tone}` e ícones `CheckCircle2 / AlertCircle / Info`.

---

## 11. Layout (`src/layouts/` + `src/components/layout/`)

### AppLayout (autenticado)

```vue
<div class="min-h-svh bg-background text-foreground overflow-x-hidden">
  <Sidebar />
  <div :class="ui.sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'" class="transition-[padding] duration-300 ease-smooth">
    <TopBar />
    <main class="px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl mx-auto" style="padding-bottom: 80px !important;">
      <RouterView />
    </main>
  </div>
  <BottomNav />
</div>
```
- Offset do conteúdo segue o estado da sidebar: `lg:pl-20` (recolhida, 80px) ou `lg:pl-64` (256px).
- `padding-bottom: 80px` reserva espaço para o BottomNav fixo (mobile).

### AuthLayout (login)
Fundo decorativo: `grid-pattern opacity-[0.08]` + blur radial (`bg-foreground/[0.04] blur-3xl`). Conteúdo centralizado em `max-w-md`. Header `h-16` com Logo; footer com `© ano · nome`.

### TopBar
`sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl safe-area-top`, altura `h-14 lg:h-16`. Mostra Logo (mobile), título da rota (`route.meta.title`, desktop), progresso de meta mensal (desktop), avatar/logout.

### Sidebar (desktop, `hidden lg:flex`)
`fixed inset-y-0 left-0 z-30 border-r border-border bg-background/80 backdrop-blur-xl`, largura anima `w-20`↔`w-64` (`transition-[width] duration-300 ease-smooth`).
- Item ativo: `bg-secondary text-foreground border border-border shadow-soft`
- Inativo: `text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent`
- Recolhida: `justify-center px-0` (esconde labels)
- Footer: card do usuário (avatar + nome + StatusDot do role)

### BottomNav (mobile, `lg:hidden`)
`fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl safe-area-bottom`. Grid de 5 colunas (`grid-cols-5`), ícone + label.
- Ativo: `text-foreground` + indicador `absolute inset-x-3 -top-px h-0.5 rounded-full bg-foreground`; ícone escala 110% e engrossa o stroke.
- Inativo: `text-muted-foreground/70`.

### PageHeader
`flex flex-col gap-1.5 mb-6 md:mb-8` com eyebrow (10px uppercase), título (`text-2xl md:text-3xl font-semibold`), descrição e slot de ações à direita.

### navigation.ts
Fonte única dos itens de nav (Lucide icons), filtrada por `mobile`/`desktop`:

```typescript
export const navItems: NavItem[] = [
  { label: 'Dashboard',  to: '/',              icon: LayoutDashboard, mobile: true, desktop: true },
  { label: 'Jogos',      to: '/jogos',         icon: CalendarDays,    mobile: true, desktop: true },
  { label: 'Jogadores',  to: '/jogadores',     icon: Users,           mobile: true, desktop: true },
  { label: 'Financeiro', to: '/financeiro',    icon: Wallet,          mobile: true, desktop: true },
  { label: 'Ajustes',    to: '/configuracoes', icon: Settings,        mobile: true, desktop: true },
]
```

---

## 12. Padrões de composição de página

**Seções em grid** (Dashboard como referência):

```html
<section class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
  <!-- 4 MetricCards: 2 col mobile, 4 col desktop -->
</section>
<section class="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
  <!-- bloco principal ocupa lg:col-span-2 -->
</section>
```

**MetricCard** (cartão de métrica):

```vue
<Card class="relative overflow-hidden">
  <div class="flex items-start justify-between gap-3">
    <div class="space-y-1 flex-1 min-w-0">
      <p class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80 font-medium">{{ label }}</p>
      <p class="text-xl md:text-2xl font-semibold tracking-tight tabular-nums">{{ value }}</p>
    </div>
    <div class="grid place-items-center size-8 rounded-xl bg-secondary border border-border/60 shrink-0 {accentClass}">
      <component :is="icon" class="size-3.5" />
    </div>
  </div>
  <div class="mt-3 flex items-center gap-2 text-[11px]"><!-- delta/hint --></div>
</Card>
```
`accentClass` por tom: `text-success` / `text-warning` / `text-destructive` / `text-info` / `text-muted-foreground`.

**Empty state** (padrão repetido):

```vue
<div class="grid place-items-center text-center py-6">
  <div>
    <Icon class="size-6 text-muted-foreground mx-auto mb-3" />
    <p class="text-sm font-medium">Título do vazio</p>
    <p class="text-xs text-muted-foreground mt-1 mb-3">Texto auxiliar</p>
    <Button size="sm" variant="secondary">Ação</Button>
  </div>
</div>
```

**Linha de status** (chip + valor):

```vue
<div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-success/[0.06] border border-success/15">
  <div class="flex items-center gap-2.5">
    <StatusDot tone="success" pulse />
    <div>
      <p class="text-sm font-medium">Label</p>
      <p class="text-xs text-muted-foreground">Subtítulo</p>
    </div>
  </div>
  <span class="text-xl font-semibold tabular-nums">{{ count }}</span>
</div>
```

> **Listas:** usar sempre `flex items-center gap-3` em linha única (nunca `grid-cols-12`, que quebra no mobile).

---

## 13. Formatação (pt-BR) — `src/lib/format.ts`

Funções de apoio (úteis se o outro projeto também for BR):

```typescript
formatCurrency(value)        // 1000  → 'R$ 1.000,00'
maskCurrencyBRL(value)       // máscara de input: "100" → "R$ 1,00"
parseCurrencyBRL(value)      // "R$ 100,00" → centavos
formatDate(date)             // "01 jan"
formatDateLong(date)         // "quarta-feira, 01 de janeiro"
formatWeekday(date)          // "qua"
formatTime(date)             // "14:30"
relativeFromNow(date)        // "em 2 dias" / "há 5 minutos"
initials(name)               // "João Silva" → "JS"
maskPhone(value)             // "(11) 99999-9999"
digitsOnly(value)            // remove tudo que não é dígito
```

---

## 14. Princípios-resumo (checklist de replicação)

1. **OKLCH** para cores, nomeadas por propósito (não por matiz).
2. **Dark mode único** (`class="dark"` fixo). Pensar sempre fundo escuro primeiro.
3. **Mobile-first**: BottomNav no mobile, Sidebar no desktop, virada em `lg`.
4. **cva + cn()** em todo componente; `props.class` sempre mesclável.
5. **Raio generoso** ancorado em `--radius: 1rem` (cards `rounded-2xl`, botões `rounded-xl`).
6. **`ease-smooth`** (`cubic-bezier(.16,1,.3,1)`) como easing padrão.
7. **Glassmorphism** (`backdrop-blur-xl` + bg semitransparente) em barras fixas e modais.
8. **Feedback de toque**: `active:scale-[0.98/0.995]`.
9. **Foco acessível**: `focus-visible:ring-2 ring-primary/20` + borda `primary/60`.
10. **Status semafórico** com StatusDot/Badge e padrão `bg/border/text-{tone}`.
11. **`tabular-nums`** em todo número.
12. **Safe areas** (`env(safe-area-inset-*)`) em barras fixas.
13. **Espaçamento** em múltiplos de 4: `gap-3 md:gap-4`, `p-5 md:p-6`, `px-4 md:px-6 lg:px-8`.
14. **Empty states** padronizados: ícone + título + auxiliar + ação.
