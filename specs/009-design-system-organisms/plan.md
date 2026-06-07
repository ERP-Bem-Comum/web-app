# Implementation Plan: Fundação de Organismos (Design System)

**Branch**: `009-design-system-organisms` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-design-system-organisms/spec.md`

## Summary

Criar a **camada de organismos** do design system (`src/shared/ui/organisms/`), entregando **2 organismos P1** agnósticos de domínio:

1. **DataTable** — tabela de dados genérica e tipada (`<T>`), com colunas configuráveis (header já traduzido + render de célula por composição) e os 4 estados mutuamente exclusivos: **ready** (com linhas), **empty**, **loading**, **error**.
2. **PageHeader** — cabeçalho de página com título, subtítulo opcional e slot de ações.

Ambos são **views burras** (recebem tudo por props), seguem a anatomia de arquivos do design system, a regra "só-tokens" (`vars.*`), strings vindas por props (resolvidas via i18n na feature consumidora → mantém o organismo agnóstico), entram no barrel `#shared/ui` e ganham **testes de DOM** (vitest + @testing-library/react) e **baselines de teste visual** (Playwright). A descoberta-chave: **a infra de lint já está pronta** (`eslint.config.js` já tem o tipo `ds-organism` e a regra "só-tokens" cobre `organisms/**`) — não há mudança de configuração; é entrega de componentes + testes + doc.

## Technical Context

**Language/Version**: TypeScript strict (6→7, `erasableSyntaxOnly`), React 19, ESM.

**Primary Dependencies**: vanilla-extract (`.css.ts`, zero-runtime), `#shared/ui/tokens` (vars), `#shared/i18n` (createTranslator — usado pelas features consumidoras, **não** dentro do organismo). Sem dependências externas novas.

**Storage**: N/A (frontend, sem persistência).

**Testing**: `node:test` para lógica pura (`*.test.ts`, imports relativos); Vitest + jsdom + @testing-library/react para DOM (`*.spec.tsx`); Playwright `toHaveScreenshot` para regressão visual (`e2e/visual/*.visual.e2e.ts`, baseline `-linux`).

**Target Platform**: Browser (app TanStack Start). Componentes server-safe (sem acesso a `window` no render inicial além do necessário).

**Project Type**: Web app (frontend) — design system compartilhado (`shared-ui`).

**Performance Goals**: Zero-runtime CSS (vanilla-extract). Render de tabela eficiente para listas de dezenas de itens (escala das telas de parceiros); virtualização **fora de escopo**.

**Constraints**: Sem `class`/`this`/`throw` (exceto bordas permitidas — não há aqui); sem `any`; imutabilidade (`Readonly<>`, `readonly T[]`); só-tokens (`vars.*`, sem hex/px crus); strings de UI via i18n (por props); fronteiras de import Atomic Design enforçadas por lint.

**Scale/Scope**: 2 organismos. Consumidores imediatos: 4 telas de listagem de parceiros (feature futura). `contracts` **não** migrado nesta feature.

## Constitution Check

> ⚠️ **Divergência registrada**: o arquivo `.specify/memory/constitution.md` deste pacote é a constituição do **core-api** (backend: Modular Monolith, Drizzle/MySQL, CLI-first, outbox — princípios I–IX, v1.1.0). Ela **não** governa o `web-app`. As invariantes reais deste pacote vivem no `AGENTS.md` + ADRs (`handbook/adr/`) + `eslint.config.js`. O Constitution Check abaixo é feito contra essas invariantes; os princípios de backend são **N/A**.

| Princípio backend (constitution.md) | Aplica? | Nota |
|---|---|---|
| I. TDD W0→W3 / pipeline core-api | N/A | Pipeline de tickets é do core-api. Aqui: TDD com testes de DOM antes da implementação. |
| II. Regressão zero | ✅ aplicável (espírito) | `pnpm verify` (typecheck+lint+test) verde antes de fechar; `test:visual` verde. |
| III. pnpm único PM | ✅ | web-app usa pnpm 11 (hook bloqueia npm). |
| IV–VII. Modular Monolith / Drizzle / MySQL / CLI-first / outbox | N/A | Backend. Feature é 100% frontend. |
| VIII. TS strict + ESM | ✅ | strict, `import type`, ESM, idioma EN no código / PT nas strings (via i18n da feature). |
| IX. Consultoria ACDG + citação | N/A | Pipeline core-api-sdd. |

**Invariantes do web-app (AGENTS.md / ADRs) — gates reais desta feature:**

- ✅ **Design system "só-tokens"** (ADR-0007): organismos usam apenas `vars.*`. Lint cobre `organisms/**`.
- ✅ **Atomic Design** (`tokens ← atoms ← molecules ← organisms`): organismo só importa para "baixo". `eslint.config.js` já define `ds-organism` permitindo `shared, ds-tokens, ds-atom, ds-molecule, ds-organism`.
- ✅ **Views burras** (constituição web-app §XI, ADR-0004): sem data-hooks (`useQuery`/`useMutation`), sem `useReducer` de negócio; recebem dados/callbacks por props.
- ✅ **Errors-as-values / sem class/this/throw**: organismos são funções puras de render; nenhuma `class`/`throw` introduzida.
- ✅ **Imutabilidade**: props `Readonly<>`, `readonly T[]`.
- ✅ **Strings via i18n**: o organismo **não** embute literais de domínio; recebe textos (header de coluna, mensagens de estado) por props, que a feature resolve via i18n. Mantém agnóstico (FR-004) **e** i18n (FR-006).
- ✅ **Fronteiras**: organismo agnóstico — nunca importa `modules/`, `data/`, `server/`.

**Resultado do gate**: PASS. Nenhuma violação → **Complexity Tracking vazio**.

## Project Structure

### Documentation (this feature)

```text
specs/009-design-system-organisms/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões de design (estados, agnosticismo i18n, render de célula)
├── data-model.md        # Phase 1 — contratos de tipos (Column<T>, DataTableProps<T>, PageHeaderProps)
├── quickstart.md        # Phase 1 — como consumir os organismos numa tela
├── contracts/           # Phase 1 — contratos de props (UI API pública)
│   ├── data-table.contract.md
│   └── page-header.contract.md
├── checklists/
│   └── requirements.md  # da fase /speckit-specify
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
src/shared/ui/
├── index.ts                         # barrel raiz — ADICIONAR: export * from './organisms/index.ts'
├── tokens/                          # (existe) vars.*
├── atoms/                           # (existe) Button, Input, Checkbox, Logo, Card
├── molecules/                       # (existe) Field, Badge, InputWithIcon
└── organisms/                       # ★ NOVO
    ├── index.ts                     # ★ barrel dos organismos
    ├── data-table/
    │   ├── data-table.component.tsx # view burra genérica <T>
    │   ├── data-table.css.ts        # vanilla-extract, só vars.*
    │   ├── data-table.types.ts      # Column<T>, DataTableProps<T>, estado
    │   └── index.ts                 # re-exporta component + tipos públicos
    └── page-header/
        ├── page-header.component.tsx
        ├── page-header.css.ts
        └── index.ts

tests/shared/ui/organisms/
├── data-table.spec.tsx              # DOM: estados ready/empty/loading/error, render de célula
└── page-header.spec.tsx             # DOM: título, subtítulo, slot de ações

e2e/visual/
└── organisms.visual.e2e.ts          # baselines: DataTable (4 estados) + PageHeader (com/sem ações)
                                     # (necessita rota/harness de showcase — ver research.md)
```

**Structure Decision**: Espelha exatamente o padrão de `atoms/`/`molecules/`. Cada organismo é uma pasta com a anatomia fixa (`component` + `css` + `index`, mais `types` quando os tipos crescem — caso do DataTable genérico). Testes espelham `src/` → `tests/`. O lint já enforça as fronteiras sem alteração.

## Complexity Tracking

> Constitution Check passou sem violações — seção intencionalmente vazia.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — feature 100% frontend, não toca core-api.

## Contrato HTTP (Fase 2+)

N/A — feature de design system (frontend). Nenhum endpoint, nenhuma server function.

## Estimativa de Pipeline (W0 size)

> Pipeline de tickets `.pipeline` é do core-api; no web-app o gate é `pnpm verify` + `pnpm test:visual`.

- **Tamanho**: [x] **M** — 2 componentes novos com tipos genéricos, CSS, testes de DOM e baselines visuais; sem alteração de infra de lint.
- **Justificativa**: escopo localizado e aditivo (nova subpasta + barrel), sem refatorar features existentes; o risco maior é design de API (props genéricas) e baselines visuais.
- **Plano de testes (TDD, RED primeiro)**:
  - `tests/shared/ui/organisms/data-table.spec.tsx` — falha por inexistência do `DataTable`; descreve: renderiza linhas a partir de `columns`+`rows`; estado `empty` mostra mensagem; `loading` mostra indicador e nenhuma linha; `error` mostra mensagem; célula customizada via `column.cell`.
  - `tests/shared/ui/organisms/page-header.spec.tsx` — falha por inexistência do `PageHeader`; descreve: renderiza título; renderiza slot de ações; sem ações/subtítulo mantém layout.
  - Baselines visuais gerados por último, após a UI estabilizar (Playwright `-linux`).
