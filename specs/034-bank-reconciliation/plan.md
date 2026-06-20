# Implementation Plan: Conciliação Bancária

**Branch**: `034-bank-reconciliation` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/034-bank-reconciliation/spec.md`

## Summary

Dois ecrãs no Financeiro espelhando o protótipo da consultoria (§9.4.x): **(1)** grid de
contas-cedente (entrada do módulo) e **(2)** workspace de conciliação de uma conta. Front + BFF: o
browser só fala com **server functions** deste app, que autenticam e chamam o `core-api`
(`/api/v2/financial/...`, contrato real do PR #152). Abordagem técnica: criar o submódulo
`bank-reconciliation` dentro de `src/modules/financial/`, **espelhando o split client×server já usado em
Contas a Pagar** (server: domain → application → adapters/server-fns; client: data/repository →
view-model/binding → ui/page+components), tokens-only, erros-como-valores ponta a ponta. Onde o backend
não existe (conta-cedente #168, OCR PDF #145, listar períodos p/ Exportar #173, enriquecimento de
título #172) a UI é **chrome honesto** com a costura (porta/gateway/server-fn) pronta para ligar.

## Technical Context

**Language/Version**: TypeScript strict (migração 6→7, `erasableSyntaxOnly`), React 19

**Primary Dependencies**: TanStack Start (Vite + Nitro), TanStack Query, TanStack Router (file-based),
Zod 4, vanilla-extract (tokens-only). Nativo preferido (`Intl`, `FileReader`/`File.text()`,
`crypto.randomUUID`).

**Storage**: N/A no front. Estado remoto via TanStack Query; estado de UI via `useReducer`/máquina
tagged em controllers/bindings. Persistência real é do `core-api` (fora deste repo).

**Testing**: `node:test` (puros: domain/application/view-model/http/mappers, `*.test.ts`, imports
relativos) + Vitest/jsdom (UI/hooks, `*.spec.tsx`, aliases). Visual regression Playwright
(`pnpm test:visual`) após mexer em UI/CSS. TDD: teste antes.

**Target Platform**: Browser (SSR via Nitro node-server) atrás do BFF unificado.

**Project Type**: Web (front + BFF unificado, módulos verticais) — single repo `web-app`.

**Performance Goals**: SC-001 conciliar por sugestão em ≤3 cliques; SC-002 importar→pronto <1min
(excl. backend); filtros de lista/período client-side com resposta imediata sobre o payload já carregado.

**Constraints**: dinheiro = string de centavos; datas ISO; PT-BR (mono nas cifras); token nunca no
browser; só títulos **Pago** conciliáveis; soma+diferença deve balancear; período fechado bloqueia
import/conciliar/desfazer; dedup por Fitid silencioso. Aditivo, **sem regressão** em Contas a Pagar.

**Scale/Scope**: 2 ecrãs, 8 user stories (P1×2, P2×3, P3×3), ~11 endpoints consumidos do core-api,
1 submódulo novo no front. 4 lacunas de backend tratadas como chrome honesto (#168/#172/#173/#145).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio                              | Como o plano cumpre                                                                                                                                                                 | Status |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Vertical-modular, isolamento        | Submódulo `bank-reconciliation` em `modules/financial`; import externo só via `public-api/index.ts`; fronteiras enforçadas por lint.                                                | ✅     |
| II. Erros como valores                 | `Result<T,E>` ponta a ponta; `throw` só na borda (`external/`, `*.server-fn.ts`) convertido na hora; sem `class` (exceto `QueryError`).                                             | ✅     |
| III. Server fn = única fronteira       | Browser → server fns deste app → core-api; nenhuma chamada direta do client ao core-api.                                                                                            | ✅     |
| IV. Estados ilegais irrepresentáveis   | Branded types + smart constructors `Result`; discriminated unions (movement, reconciliation type, manual-entry type, difference treatment) + `switch` exaustivo (`const _: never`). | ✅     |
| V. Cadeia de erro fim-a-fim            | `resultFetch → mapToServerResponse → QueryError(mapToAppError) → switch em AppError.kind → tag i18n`; UI nunca olha status HTTP.                                                    | ✅     |
| VI. TS estrito/apagável                | Sem `enum`/`namespace` runtime/parameter properties; unions de literais + `as const`.                                                                                               | ✅     |
| VII. Imutabilidade                     | `Readonly<>`, `readonly T[]`, `as const`.                                                                                                                                           | ✅     |
| VIII. Mínimo de deps                   | Nenhuma dep nova prevista; leitura de arquivo via `File.text()`, IDs via `crypto.randomUUID`.                                                                                       | ✅     |
| IX. Segurança por construção           | Token server-side; validação Zod no input da server fn **e** no response do core-api; sem segredo no bundle.                                                                        | ✅     |
| X. Design system só-tokens             | `vars.*` de `#shared/ui/tokens`; sem hex/rgb/px crus em `ui/`; mapear tokens do mock (teal/Inter/Mono) para os tokens do app.                                                       | ✅     |
| XI. MVVM views burras; server≠UI state | `*.page.tsx`/`*.component.tsx` sem data-hooks/`useReducer`; tudo na view-model/binding/controller; server-state no Query, UI-state em reducer.                                      | ✅     |
| XII. Eventos de domínio (bus)          | Onde houver intenção de UI cross-cutting (ex.: conciliou → invalida listas/contagens) usar o padrão de eventos/invalidations já em uso.                                             | ✅     |

**Resultado do gate**: PASS (sem violações; nenhuma entrada em Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/034-bank-reconciliation/
├── plan.md              # Este arquivo
├── spec.md              # Spec (com Clarifications)
├── research.md          # Fase 0 (decisões)
├── data-model.md        # Fase 1 (entidades/VOs/estados)
├── quickstart.md        # Fase 1 (como rodar/testar o fluxo)
├── contracts/           # Fase 1 (contrato das server fns BFF)
│   ├── server-fns.md
│   └── chrome-gaps.md
├── checklists/
│   └── requirements.md  # (já existe, 16/16)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

Novo submódulo no front, espelhando o split de `contas-a-pagar`:

```text
src/modules/financial/
├── server/
│   ├── domain/
│   │   ├── reconciliation.io.ts                 # tipos de domínio (Result), VOs branded
│   │   └── errors/financial.errors.ts           # (estender) erros de conciliação como valor
│   ├── application/
│   │   └── financial.use-cases.ts               # (estender) use-cases de conciliação
│   └── adapters/
│       ├── core-api/
│       │   ├── core-api-financial.ts            # (estender) chamadas /api/v2/financial/*
│       │   ├── financial.schema.ts              # (estender) schemas Zod request/response
│       │   └── financial.mappers.ts             # (estender) mapeamento puro → modelo
│       ├── financial.io-schemas.ts              # (estender) schemas de input das server fns
│       ├── financial.composition.ts             # (estender) wiring
│       └── server-fns/                          # ★ a fronteira (uma fn por caso)
│           ├── import-bank-statement.service.fn.ts
│           ├── list-statement-transactions.query.fn.ts
│           ├── list-paid-payables.query.fn.ts
│           ├── get-transaction-suggestions.query.fn.ts
│           ├── reject-suggestion.service.fn.ts
│           ├── create-reconciliation.service.fn.ts
│           ├── undo-reconciliation.service.fn.ts
│           ├── create-manual-entry.service.fn.ts
│           ├── batch-reconcile.service.fn.ts
│           └── close-reconciliation-period.service.fn.ts
│           # export + conta-cedente: server-fn "costura" (chrome) — ver contracts/chrome-gaps.md
├── client/
│   ├── data/
│   │   ├── model/reconciliation.model.ts        # model Zod do client (mínimo até #172)
│   │   ├── repository/financial.repository.ts   # (estender) porta → server fns
│   │   └── reconciliation.gateway.ts            # gateway p/ download/export (chrome até #173)
│   ├── reconciliation-accounts/                 # TELA 1 — grid de contas (chrome até #168)
│   │   ├── reconciliation-accounts.view-model.ts
│   │   ├── reconciliation-accounts.query.ts
│   │   ├── *.binding.ts
│   │   ├── page/reconciliation-accounts.page.tsx (+ .css.ts)
│   │   └── components/*.component.tsx (grid, filtros, modal adicionar conta)
│   └── reconciliation-workspace/                # TELA 2 — workspace
│       ├── reconciliation-workspace.view-model.ts
│       ├── reconciliation-workspace.query.ts
│       ├── import.binding.ts / reconcile.binding.ts / manual-entry.binding.ts /
│       │   undo.binding.ts / close-period.binding.ts / account-selector.binding.ts
│       ├── page/reconciliation-workspace.page.tsx (+ .css.ts)
│       └── components/  (acc-header, period-filter, import-menu, tabs,
│           imports-list, suggestion-pane, new-transaction-pane, search-create-pane,
│           statement-grid, bottombar, detail-modal, change-account-modal)
└── public-api/index.ts                          # (estender) exporta as views/types públicos

src/routes/_authenticated/financeiro/
└── conciliacao/
    ├── index.tsx                                # TELA 1 (grid de contas)
    └── $accountId.tsx                            # TELA 2 (workspace da conta)

tests/modules/financial/                          # espelha src/ (puros *.test.ts + DOM *.spec.tsx)
```

**Structure Decision**: **Submódulo dentro de `src/modules/financial/`** (não um módulo top-level
novo), porque Conciliação é uma capability do BC Financeiro e reaproveita `data/money.ts`, o
`financial.repository`, os erros e o `core-api-financial` já existentes — mantendo um único
`public-api` para o Financeiro. As duas telas viram duas pastas-feature no `client/` (espelhando o
padrão `contas-a-pagar-list`/`document-create`), e o `server/` é **estendido** (não duplicado).

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** — esta feature é front+BFF; não toca `core-api`.
- **Prefixo de isolamento correto?** N/A
- **Outbox**: não.
- **Comando**: N/A.
- **Restrições MySQL 8**: N/A.

## Contrato HTTP (Fase 2+)

**N/A — esta feature NÃO cria/altera endpoints do core-api.** O contrato HTTP já existe (PR #152) e é
apenas **consumido**. A borda própria deste app são as **server functions** (BFF), cujo contrato
request/response (Zod) está em [`contracts/server-fns.md`](./contracts/server-fns.md). Lacunas onde o
core-api ainda não expõe endpoint (#168/#172/#173/#145) estão em
[`contracts/chrome-gaps.md`](./contracts/chrome-gaps.md).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **L** — submódulo novo, múltiplas server fns (≈11), 2 ecrãs ricos, várias
  discriminated unions e regras de balanceamento; toca server (domain/application/adapters) e client
  (data/view-model/ui) + rotas.
- **Justificativa**: superfície ampla mesmo sendo consumo-only; o risco está nas regras de
  balanceamento/estados e na fidelidade de UI, não em schema de banco.
- **Plano de testes W0 (RED)**: começar pelos puros — (a) mappers core-api→model
  (`financial.mappers` p/ transações/sugestões/payables), (b) regra de **balanceamento** da
  conciliação (soma títulos + diferença = valor da transação) na application/view-model, (c)
  derivações da view-model do workspace (agrupar por dia, filtros Pendentes/Conciliadas/Todas, progresso
  X/N, gating do botão conciliar), (d) `mapToAppError` → tags i18n dos erros do contrato. DOM depois
  (Vitest): seleção de transação, confirmação consciente em Transferência/Aplicação/Resgate, estados
  chrome desabilitados/anunciados.
