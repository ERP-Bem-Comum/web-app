# Implementation Plan: Relatórios — 3 endpoints reais (#114)

**Spec**: `./spec.md` · **Feature-modelo de server**: `src/modules/financial/server/` (DDD) e
`src/modules/auth/server/`. **Tamanho**: L.

## Constitution Check (§I–§XII)

| §   | Princípio                        | Como o plano cumpre                                                                                              |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| I   | Vertical-modular                 | tudo em `src/modules/reports/`; cross-módulo só via `public-api` (usa `auth/public-api` p/ token/user).          |
| II  | Erros como valores               | `Result<T, ReportsError>` em domain/application; `throw` só na borda do `resultFetch`/mapper.                    |
| III | Server fn = única fronteira      | 3 `*.query.fn.ts` compõem a resposta completa; o client não compõe.                                              |
| IV  | Estados ilegais irrepresentáveis | união discriminada de estado de binding (loading/error/empty/ready); `switch` exaustivo no error-tag.            |
| V   | Cadeia de erro fim-a-fim         | `mapHttpError` → `ReportsError`; a UI trata só a tag i18n.                                                       |
| VI  | TS estrito e apagável            | tipos de I/O puros (sem Zod no domain); Zod só na borda (adapters).                                              |
| VII | Imutabilidade                    | `Readonly<>`/`readonly[]` em todos os models.                                                                    |
| IX  | Segurança por construção         | token nunca no browser; auth no handler (getCurrentUserFn + resolveAccessTokenFn); Zod na borda.                 |
| X   | Design system só-tokens          | nenhum CSS novo cru; reusa componentes/telas existentes.                                                         |
| XI  | MVVM + views burras              | view-models puros ganham ADAPTERS (DTO model → row shape); binding React isola o acoplamento; views inalteradas. |
| XII | Reatividade por eventos          | não aplicável (leitura).                                                                                         |

Sem violações a registrar.

## Arquitetura da cadeia (por relatório)

```
GET /api/v2/reports/<x>  (core-api)
  → core-api-reports.ts (HTTP client, resultFetch)          [adapters/core-api]
  → reports.schema.ts (Zod da resposta crua)                [adapters/core-api]
  → reports.mappers.ts (DTO → Model, PURO, mapHttpError)    [adapters/core-api]
  → reports.use-cases.ts (porta ReportsClient + use-cases)  [application]
  → reports.composition.ts (composition root, env DENTRO)   [adapters]
  → <x>.query.fn.ts (server fn; auth no handler; Result)    [adapters/server-fns]
  → reports.repository.ts + .instance.ts (client porta)     [client/data/repository]
  → <x>.binding.ts (useQuery → Result → estado discriminado)[client]
  → view-model ADAPTER (Model → row shape existente)        [client]
  → PAGE (loading/error/empty/ready → view burra existente) [client/page]
```

## Contratos (server-fn — assinaturas fixas para o client)

- `getTeamReportFn(): Promise<{ok:true; data: readonly TeamMember[]} | {ok:false; error: ReportsError}>`
- `getSuppliersWithoutContractFn(): Promise<{ok:true; data: readonly SupplierWithoutContract[]} | {ok:false; error: ReportsError}>`
- `getPaymentPositionFn(): Promise<{ok:true; data: readonly PaymentPosition[]} | {ok:false; error: ReportsError}>`

`ReportsError = 'unauthorized' | 'forbidden' | 'validation' | 'connectivity' | 'server'` (read-only:
sem estados de negócio como conflict/not-found na Fatia atual; espelha o mínimo de `FinancialError`).

### Models (client/data/model — espelham o server io)

- `TeamMember = { id, name, program: string|null, role, employmentRelationship, startOfContract,
registrationStatus, active, education: string|null, experienceInPublicSector: boolean|null }`
- `SupplierWithoutContract = { supplierRef, name: string|null, totalCents: number, payableCount: number }`
- `PaymentPosition = { supplierRef, supplierName, costCenterRef, costCenterName, categoryRef, categoryName
(todos string|null), pendingCents, paidCents, overdueCents (number) }`

## Decisões de GAP (dados reais vs. telas front-first)

### D1 — Posição de Pagamentos: mapeamento limpo (1:1)

DTO `PaymentPosition` → `RawPosicaoRow` do view-model:
`{ supplier: supplierName ?? '—', costCenter: costCenterName ?? '—', category: categoryName ?? '—',
emAtrasoCents: overdueCents, pagoCents: paidCents, aPagarCents: pendingCents }`. O binding mapeia e chama
`aggregatePosicao(rows)` (já exportado). **Recebimentos** (`'r'`) segue placeholder. Sem perda.

### D2 — Fornecedores sem Contrato: sem quebra por plano

O endpoint entrega total AGREGADO por fornecedor + `payableCount`, SEM dimensão de plano orçamentário. O
placeholder tinha `RawSupplierRow{supplier, budgetPlan, totalCents}`. **Decisão**: mapear cada fornecedor a
UMA linha `{ supplier: name ?? supplierRef, budgetPlan: '—', totalCents }`. A árvore mostra o fornecedor com
um único filho "—"; a matemática do limite (por fornecedor) fica intacta. `payableCount` fica disponível no
model p/ uso futuro (não altera a view agora). **Handoff backend**: expor a quebra por plano se necessário.

### D3 — Equipe ABC: endpoint LGPD-safe sem demografia

O endpoint NÃO traz idade/gênero/raça-cor (9 colunas LGPD-safe). **Decisão**:

- Wire REAL: **tabela**, **CSV**, gráfico **Função** (de `role`) e **Ano de Contrato** (ano de
  `startOfContract`). Colunas sem fonte (idade/gênero/raça-cor) exibem "—".
- Os 3 gráficos demográficos (**Gênero** donut, **Raça/Cor** barras, **Idade** barras) caem no
  **empty-state honesto** (os componentes já recebem `emptyLabel`) — NÃO inventam distribuição.
- ADAPTER `toTeamRows(members)` mapeia o Model real → `TeamMemberRow` existente com sentinelas honestos:
  `idade=null` ("N/A"), `racaCor='N/A'`, `genero` → precisa de sentinela; `Genero` NÃO tem 'N/A' →
  a page passa `[]` (dataset vazio) ao donut de Gênero em vez de forçar um valor, mantendo o tipo intacto.
- `programa/vinculo/escolaridade` do view-model são enums estreitos; o Model real é string livre → o ADAPTER
  NÃO força o enum: a tabela/CSV exibem a string real; os gráficos por enum estreito (que não existem para
  esses campos) não são afetados. `byFuncao` opera sobre string livre (já é string).
- **Handoff backend**: endpoint de agregação demográfica (se e quando LGPD permitir) reабilita os 3 gráficos.

## Refactor de sincronismo → async

As 3 pages hoje chamam `loadX()` (placeholder síncrono). Passam a usar o binding (`useQuery`) e renderizam por
estado: `loading` (skeleton/placeholder de carregamento simples), `error` (mensagem + tag i18n), `empty`
(empty-state existente), `ready` (view atual). O UI-state local (filtros, paginação, modal) permanece.

## Testes

- **node:test**: 3 mappers (DTO→Model, incl. drift→err e nullable→fallback); ADAPTERS de view-model
  (`toTeamRows`, `toRawPosicaoRows`, `toRawSupplierRows`). Fixtures SINTÉTICAS (LGPD).
- **Vitest/jsdom**: 3 bindings (mock da repository/fn) cobrindo loading/error/empty/ready; troca
  placeholder→real na page (empty-state/loading/erro preservados).

## Gate

`pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm test` (node) · `pnpm test:dom` · `pnpm build`. Regressão zero.

## Riscos

- Refactor async pode alterar snapshots visuais (e2e) — não incluído no gate pedido; validar em tela.
- Enums estreitos do view-model de Equipe vs. string real — mitigado no ADAPTER (não força enum).
