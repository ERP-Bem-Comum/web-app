# Tasks: Relatórios — 3 endpoints reais (#114)

Fonte: `./plan.md`. Ordem: server (fundação) → client (wire) → testes → gate.

## Fase 0 — Fundação server (bloqueia tudo)

- [x] T001 `server/domain/errors/reports.errors.ts` — `ReportsError` (union mínima read-only).
- [x] T002 `server/domain/reports.io.ts` — tipos de I/O puros: `TeamMember`, `SupplierWithoutContract`, `PaymentPosition`.
- [x] T003 `server/adapters/core-api/reports.schema.ts` — Zod das 3 respostas cruas (`{team:[...]}`, `{suppliers:[...]}`, `{positions:[...]}`).
- [x] T004 `server/adapters/core-api/reports.mappers.ts` — mappers PUROS DTO→Model + `mapHttpError` (drift→'server').
- [x] T005 `server/adapters/core-api/core-api-reports.ts` — client HTTP (3 GET, `resultFetch`, delega aos mappers).
- [x] T006 `server/application/reports.use-cases.ts` — porta `ReportsClient` + 3 use-cases (thin).
- [x] T007 `server/adapters/reports.composition.ts` — composition root (`coreApiBase(env,'v2')/reports`, cache).

## Fase 1 — Server functions (fronteira)

- [x] T010 `server/adapters/server-fns/get-payment-position.query.fn.ts` (P1).
- [x] T011 `server/adapters/server-fns/get-suppliers-without-contract.query.fn.ts` (P2).
- [x] T012 `server/adapters/server-fns/get-team-report.query.fn.ts` (P3).
  - Todas: `getCurrentUserFn` + `resolveAccessTokenFn` no handler; sem input; Result completo.

## Fase 2 — Client data (porta)

- [x] T020 `client/data/repository/reports-error.ts` — `ReportsError` neutro + `FnResult<T>`.
- [x] T021 `client/data/helpers/reports-error-tag.ts` — `reportsErrorTag` (switch exaustivo → tag i18n).
- [x] T022 `client/data/model/{team-report,supplier-without-contract,payment-position}.model.ts`.
- [x] T023 `client/data/repository/reports.repository.ts` + `.instance.ts` (wire das 3 fns).

## Fase 3 — View-model adapters + bindings + pages

- [x] T030 [P1] `posicao.view-model.ts`: + `toRawPosicaoRows(positions)` (adapter puro). Binding `posicao.binding.ts`. Page: consumir binding, preservar 'r' placeholder + empty/error/loading.
- [x] T031 [P2] `suppliers-without-contract.view-model.ts`: + `toRawSupplierRows(suppliers)`. Binding. Page.
- [x] T032 [P3] `equipe.view-model.ts`: + `toTeamRows(members)` (sentinelas honestos). Binding. Page: gráficos demográficos → dataset vazio/empty-state; tabela/CSV/Função/Ano reais.
- [x] T033 `public-api/index.ts`: exportar os novos adapters/tipos conforme necessário (sem vazar server).

## Fase 4 — Testes

- [x] T040 node: `tests/**` mappers (3) — DTO→Model, drift→err, nullable→fallback (fixtures sintéticas).
- [x] T041 node: adapters de view-model (`toTeamRows`/`toRawPosicaoRows`/`toRawSupplierRows`).
- [x] T042 dom: 3 bindings (loading/error/empty/ready) + troca placeholder→real na page.

## Fase 5 — Gate

- [x] T050 `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:dom` · `pnpm build` — todos verdes.

## Gaps registrados (ver plan.md D1–D3)

- Recebimentos (A-Receber) segue placeholder.
- Fornecedores sem quebra por plano (endpoint agrega por fornecedor).
- Equipe sem demografia (endpoint LGPD-safe) → 3 gráficos em empty-state honesto.

## Notas de execução (2026-07-14)

- **Novo componente** `components/report-state-panel.component.tsx` (+ `.css.ts`, só-tokens): painel loading/erro
  compartilhado pelas 3 pages (a `PosicaoReportView` já resolvia o EMPTY a partir do `report`).
- **Bindings** ficaram em `posicao.binding.ts` / `suppliers-without-contract.binding.ts` / `equipe.binding.ts`,
  com `*.query.ts` (queryOptions agnóstico) ao lado — todos `staleTime 60s`, `retry 1`.
- **`TeamMemberRow`** teve os 5 campos de exibição livre (`programa/vinculo/escolaridade/genero/racaCor`) alargados
  p/ `string` (o Model real é string livre; sem forçar enum). `countByOrder` passou a `string`. Node tests do
  view-model seguem verdes (literais do placeholder são strings válidas).
- **i18n**: +`reports.error.*` (5 tags), +loading/errorTitle das 3 telas, +`reports.equipe.chartUnavailable`.
- **T033**: public-api NÃO mudou — routes consomem só as PAGES (já exportadas); bindings/adapters são internos.
- **Gate**: typecheck 0 · lint 0 erro · node **1431** (baseline 1410, +21) · dom **535** (baseline 521, +14) · build ✓.
