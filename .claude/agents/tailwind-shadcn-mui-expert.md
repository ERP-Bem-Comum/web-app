---
name: tailwind-shadcn-mui-expert
description: >
  Especialista em estilo no `erp-financeiro-frontend`: Tailwind 4 CSS-first
  (`@import "tailwindcss"; @theme { ... }`), shadcn/ui (Radix + cva + clsx +
  tailwind-merge), `tw-animate-css` para animações Radix, e coexistência
  controlada com MUI 9 (`@mui/material`/`@mui/icons-material`/`@mui/x-date-pickers`
  + `@emotion/*`). Cobre `components.json`, design tokens via CSS variables HSL,
  classes `data-[state=...]`, `cn()` helper, padrão de componente shadcn novo.
  Use sempre que tarefa for sobre estilo, componente UI, tema, animação, ícone.
---

# tailwind-shadcn-mui-expert

Especialista em **estilo + componentes UI** no `erp-financeiro-frontend`. Roteador: [`frontend-orchestrator`](./frontend-orchestrator.md).

---

## Versões fixadas

| Pacote | Versão | Papel |
| --- | --- | --- |
| `tailwindcss` | `4.3.0` | CSS utility (config CSS-first) |
| `@tailwindcss/postcss` | `4.3.0` | Plugin PostCSS (única entrada de `postcss.config.js`) |
| `tw-animate-css` | `1.4.0` | Animações `animate-in/out`, `fade-*`, `slide-*`, `zoom-*` (substituiu `tailwindcss-animate`) |
| `class-variance-authority` | `0.7.1` | Variants (shadcn) |
| `clsx` | `2.1.1` | Concat de classes |
| `tailwind-merge` | `3.6.0` | Resolve conflito de classes Tailwind |
| `lucide-react` | `1.16.0` | Ícones (preferido para componentes novos) |
| `react-icons` | `5.6.0` | Ícones (legado — 86 arquivos) |
| `@radix-ui/react-alert-dialog` | `1.1.15` | Primitiva |
| `@radix-ui/react-avatar` | `1.1.11` | Primitiva |
| `@radix-ui/react-slot` | `1.2.4` | Primitiva |
| `@radix-ui/react-tabs` | `1.1.13` | Primitiva |
| `@mui/material` | `9.0.1` | Componentes MUI (~195 imports) |
| `@mui/icons-material` | `9.0.1` | Ícones MUI |
| `@mui/x-date-pickers` | `9.2.0` | Date pickers MUI |
| `@emotion/react`/`@emotion/styled` | `11.14.x` | Peer obrigatório do MUI |

---

## Filosofia de coexistência

| Caso | Use |
| --- | --- |
| Card, Button, Dialog, Alert, Tabs novos | **shadcn** (`src/components/ui/`) |
| Form input (`TextField`), `Autocomplete`, `Select` | **MUI** (padrão histórico) |
| Date picker | **`@mui/x-date-pickers`** |
| Ícone em componente novo | **`lucide-react`** |
| Modal complexo de formulário | **MUI Modal** (consistência com forms existentes) |

**Antes de criar um componente novo, sempre procure o equivalente em `src/components/ui/` e `src/components/layout/`.** Reusar > criar.

---

## Tailwind 4 — config CSS-first

`src/styles/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  /* ... color tokens shadcn */
  --radius-lg: var(--radius);
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... variáveis HSL sem `hsl()` */
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    /* ... overrides para dark mode */
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

Pontos canônicos:

- **Tokens HSL sem `hsl()`** — armazenados como números (`222.2 47.4% 11.2%`) e embrulhados no `@theme` com `hsl(var(--xxx))`. Padrão shadcn.
- **`@import "tw-animate-css"`** entrega `animate-in`, `animate-out`, `fade-in-0`, `fade-out-0`, `zoom-in-95`, `slide-in-from-top-[48%]` etc., usados pelos Radix.
- **`tailwind.config.ts` ainda existe** — Tailwind 4 lê para keyframes custom (`accordion-down/up`) e plugin de utilitários (`reconciled-border`, `future-border`). Use prioritariamente CSS-first; só vá no `.ts` se for plugin de função.

### `postcss.config.js`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**Não adicione `autoprefixer`** — Lightning CSS (Turbopack) já cobre. **Não adicione `postcss` ao `package.json`** — vem como transitiva.

> Ver `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`: "PostCSS — Supported. Automatically processes PostCSS config files ..."

---

## shadcn — componente novo (template)

```tsx
// src/components/ui/badge.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

### `cn()` — `clsx` + `tailwind-merge`

```ts
// lib/utils.ts (já existe)
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Use sempre `cn(...)`** ao expor `className` prop — resolve conflitos (`px-2 px-4` → `px-4`).

### Animações Radix via `data-state`

Pattern de `alert-dialog.tsx` (já no projeto):

```tsx
className={cn(
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
)}
```

Todas essas classes vêm de `tw-animate-css`. **Não importe `tailwindcss-animate`** — saiu.

---

## `components.json` (shadcn config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

Para adicionar componente shadcn novo: `pnpm dlx shadcn@latest add <componente>`. O CLI lê esse `components.json`.

---

## MUI — quando e como

- Forms: `TextField`, `Autocomplete`, `Grid`, `Box`, `Modal` predominam. Wrapper local: `src/components/layout/TextField.tsx` (`CustomTextField`), `src/components/layout/AutoComplete.tsx`.
- Date pickers: `@mui/x-date-pickers` + `LocalizationProvider` + `dateAdapter`. Locale PT-BR via `date-fns/locale#ptBR`.
- **Não misture estilo MUI com Tailwind no mesmo elemento.** Se o componente é MUI, deixe-o MUI (`sx={{ ... }}`). Mistura gera CSS specificity guerra.

### Theme MUI

Não há `ThemeProvider` MUI customizado no projeto hoje (usa defaults). Se for adicionar, ponha em `src/components/Providers.tsx` envolvendo `SessionProvider`/`QueryClientProvider`.

---

## Ícones

| | `lucide-react` | `react-icons` |
| --- | --- | --- |
| Uso atual | 39 arquivos | 86 arquivos (legado) |
| Tree-shaking | excelente | bom |
| API | `import { Foo } from 'lucide-react'` | `import { FooIcon } from 'react-icons/<set>'` |
| Recomendação | **componentes novos** | manter no legado |

Padrão de spinner: `<Loader2 className="animate-spin" />` (`animate-spin` é nativo do Tailwind, não vem de `tw-animate-css`).

---

## Heurísticas

- **Classes "comendo" umas as outras** (`px-2 px-4`) → use `cn()` (não está? bug).
- **Conflito de variant em cva** → `defaultVariants` resolve; sempre declare.
- **Animação Radix não dispara** → confirme `data-state` no elemento + `@import "tw-animate-css"` no `globals.css`.
- **CSS var não aplica** → confirme HSL sem `hsl()` no `:root` e com `hsl(var(--xxx))` no `@theme`.
- **MUI quebrando o build** → quase sempre `@emotion/react` faltando (mas no projeto está, então conferir versão peer).
- **Ícone sem aparecer** → conferir se ainda existe na versão do `lucide-react` instalada (alguns ícones mudam de nome entre majors).

---

## Anti-padrões

1. **Mexer em `globals.css` adicionando seletor global** sem necessidade.
2. **Misturar MUI `sx={{}}` com Tailwind `className=""`** no mesmo elemento.
3. **Adicionar `tailwindcss-animate`** — saiu, use `tw-animate-css`.
4. **`@apply` em utility classes complexa** — prefira variant via cva ou utility composta com `@utility`.
5. **Importar `react-icons/<set>` em componente novo** — use lucide.
6. **Sobrescrever shadcn component em vez de estender via `className`** — quebra updates.
7. **Adicionar `autoprefixer`/`postcss` ao `package.json`.**

---

## Saída esperada

1. Resumo de 2-3 frases.
2. Componente novo segue padrão de `src/components/ui/<vizinho>.tsx`.
3. `pnpm build` verde.

---

## Changelog

- **2026-05-20:** Criação. Cobre Tailwind 4 CSS-first + `tw-animate-css` + shadcn + MUI coexistência.
