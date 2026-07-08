# Plan — BFF compõe o `DashboardStatisticsDto` — 052 (escala M, INTERIM front-first)

## Abordagem

Mover a montagem das estatísticas do Dashboard do `client/` para o BFF (server function), mantendo a
UI byte-idêntica. O core-api#112 (agregações cruas) está ABERTO → a composição roda sobre uma FONTE
placeholder **isolada num único arquivo** do server. Trocar pelo #112 = trocar SÓ essa fonte.

Fluxo: FONTE crua (placeholder, server) → composição PURA (domain) → `DashboardStatisticsDto` →
server fn → repository (client) → query (TanStack) → binding → view-model PURO → views burras.

## Server (BFF · DDD)

- `server/domain/dashboard.io.ts` — tipos PUROS (§VI, sem Zod): `DashboardStatisticsDto` + sub-tipos
  (metric/chart/donut/supplier) e `DashboardAggregations` (a forma crua que o #112 entregará).
- `server/domain/dashboard.composition.ts` — `composeDashboardStatistics(agg): DashboardStatisticsDto`
  PURA: monta os 4 cards (label/trend keys + accent + icon), a série (yMax/yTicks/12 meses), a
  distribuição (tons c1..c4 por ordem) e o top-N de fornecedores. Sem I/O, sem `throw` (§II/§IV).
- `server/adapters/core-api/dashboard.schema.ts` — Zod schema da resposta crua (a **borda** §IX);
  `output` assinável a `DashboardAggregations`.
- `server/adapters/dashboard-statistics.placeholder-source.ts` — a FONTE INTERINA: holda a agregação
  crua literal, valida-a pelo schema (`parse`), devolve `Result<DashboardAggregations, FinancialError>`.
  ★ ÚNICO ponto a trocar quando o #112 subir (troca o literal por `client.getAggregations(token)`).
- `server/application/dashboard.use-cases.ts` — `createGetDashboardStatistics({ source })`: chama a
  fonte → compõe → `Result<DashboardStatisticsDto, FinancialError>` (§II, sem `throw`).
- `server/adapters/financial.composition.ts` — wire da fonte no composition root (`getDashboardStatistics`).
- `server/adapters/server-fns/get-dashboard-statistics.query.fn.ts` — `createServerFn({method:'GET'})`;
  auth/RBAC no HANDLER (sessão + token, como `recent-payments`); sem input (nada a validar na borda);
  retorna `{ ok, data } | { ok, error }`.

## Client (MVVM)

- `client/data/model/dashboard-statistics.model.ts` — espelha o DTO (como `recent-payment.model.ts`).
- `client/data/repository/financial.repository.ts` (+ `.instance.ts`) — `getDashboardStatistics()`.
- `client/dashboard/dashboard-statistics.query.ts` — `dashboardStatisticsQueryOptions` (agnóstico).
- `client/dashboard/dashboard-statistics.binding.ts` — `useDashboardStatistics()` → união
  `{ status: 'loading'|'forbidden'|'error'|'ready'; data }` (§IV). React só aqui (ADR-0009).
- `client/dashboard/dashboard-summary.view-model.ts` — REMOVE as constantes de dados
  (`METRIC_CARDS`/`CHART_*`/`DONUT_SLICES`/`SUPPLIERS_WITHOUT_CONTRACT`/`LIMITE_CENTS`); MANTÉM os
  TIPOS (usados pelas views/specs) e as derivações puras (`deriveSupplierComplianceBars`, formatadores);
  ADD mapeadores DTO → props (`toDonutSlices` etc.).
- `client/dashboard/page/dashboard-content.component.tsx` — view BURRA nova: recebe o DTO + o
  `RecentPaymentsView` por props e renderiza as 2 linhas (extraído da page → DOM-testável sem rede).
- `client/dashboard/page/dashboard.page.tsx` — binding: `useDashboardStatistics()` + `useRecentPayments()`;
  ramifica loading/erro/ready; passa o DTO ao `DashboardContent`.

## i18n

- Adicionar `dashboard.state.loading` e `dashboard.state.error` (estados da page). Demais chaves já existem.

## Constitution Check (§I–§XII)

- §I: tudo em `financial/{server,client}`; import externo só por public-api. OK.
- §II: `Result` em tudo; composição/use-case sem `throw`; `throw` só na borda (Zod `parse` → `catch`). OK.
- §III: a server fn é a ÚNICA fronteira; o BFF compõe o DTO completo; o client não compõe. OK.
- §IV/§VII: uniões discriminadas + `Readonly`/`as const`; sem estados ilegais. OK.
- §V: erro trafega como valor (`FinancialError`) até o estado da page; a UI não olha status HTTP. OK.
- §VI: TS estrito, sem any/enum; tipos do domínio sem Zod (schema na borda). OK.
- §IX: Zod na borda (schema da agregação crua); auth/RBAC no handler; token não volta ao client. OK.
- §XI: view-model PURO (deriva do DTO); views BURRAS; server-state ≠ UI-state (TanStack Query). OK.
- Sem decisão arquitetural nova (segue ADR-0049/0010/0011) → sem ADR.

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — baseline lint 0/115.
Testes: node:test da composição pura (DTO correto a partir do placeholder) + atualização dos specs
existentes do dashboard (view-model.test, line-chart.spec) para a nova origem + DOM test do
`DashboardContent` (4 cards + gráficos a partir do DTO). Sem `!` (non-null); atenção ao NBSP do BRL.
</content>
