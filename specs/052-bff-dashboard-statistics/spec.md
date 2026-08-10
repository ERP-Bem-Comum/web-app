# Feature Specification: BFF compõe o `DashboardStatisticsDto` — 052

**Feature Branch**: `052-bff-dashboard-statistics`

**Created**: 2026-07-08

**Status**: Draft (INTERIM front-first)

**Input**: core-api#352 (camada Frontend/BFF) — mover a montagem das estatísticas do Dashboard do
client (constantes hardcoded) para o BFF (server function), alinhando com ADR-0049/#349 (o BFF é a
fronteira). As agregações CRUAS reais chegam com o core-api#112 (ABERTO) — por ora a composição roda
sobre uma FONTE placeholder isolada no server.

## User Scenarios & Testing

### User Story 1 - Dashboard consome o DTO composto pelo BFF (Priority: P1)

Ao abrir `/dashboard`, a usuária vê exatamente a mesma tela de hoje (4 cards de métrica, gráfico
Previsto × Realizado, donut por centro de custo, fornecedores sem contrato), mas os dados agora vêm
de uma **server function** que compõe o `DashboardStatisticsDto` no BFF — não mais de constantes
montadas no browser.

**Why this priority**: é o objetivo único da tarefa — mover a fronteira de composição para o BFF
(§III, ADR-0049) sem regredir a UI já validada. Sem isso, o Dashboard viola a regra "o client não
compõe".

**Independent Test**: abrir `/dashboard` logado → a tela renderiza idêntica; a origem dos dados é a
`getDashboardStatisticsFn` (server-state via TanStack Query), verificável no DOM test que mocka a
query e confere os 4 cards + os gráficos.

**Acceptance Scenarios**:

1. **Given** sessão válida, **When** a página monta, **Then** o Dashboard busca o DTO via server fn e
   renderiza os 4 cards, o gráfico de 2 séries (12 meses), o donut e as barras de fornecedores com os
   **mesmos** valores/aparência de hoje.
2. **Given** a server fn respondeu, **When** a composição roda, **Then** as %/top-N/distribuição/tons
   do donut e a ordenação dos fornecedores são derivadas pelo BFF/composição pura (não hardcoded no
   client).
3. **Given** a fn falhou (erro/forbidden), **When** a página resolve o estado, **Then** a UI mostra um
   estado de erro/carregamento tratado na binding/page (a View permanece burra).

### Edge Cases

- Placeholder ainda ativo: a FONTE crua é interina (isolada num único módulo do server) até o #112.
- Loading transitório: a tela tem um estado de carregamento antes de `ready` (server-state sempre tem).
- Erro do BFF → `FinancialError` (valor) → tag/estado na page; a View nunca olha status HTTP (§V).

## Requirements

### Functional Requirements

- **FR-001**: O BFF DEVE expor uma server function de leitura que retorna o `DashboardStatisticsDto`
  completo (4 métricas, série do gráfico, distribuição por centro de custo, fornecedores sem contrato).
- **FR-002**: A composição do DTO (%/top-N/distribuição/tons/layout dos widgets) DEVE ser uma função
  **pura** no server, alimentada por uma FONTE de agregações cruas.
- **FR-003**: A FONTE de agregações cruas DEVE ser um único ponto placeholder INTERINO, trocável pelo
  core-api#112 (SUM/GROUP-BY/TOP-N) sem alterar a composição.
- **FR-004**: O handler DEVE checar sessão/RBAC no próprio handler (não só na rota) e propagar erro
  como **valor** (`Result` → união `FinancialError`).
- **FR-005**: O client DEVE consumir o DTO via **TanStack Query** (server-state), e o view-model DEVE
  virar derivação **pura** do DTO → props das views (sem dados hardcoded).
- **FR-006**: A UI do Dashboard DEVE permanecer **idêntica** (mesmos valores placeholder → mesmo
  visual): cards com barra de acento, donut por centro de custo com as cores `dash.*`, linha
  "Visão Geral", barras de compliance.

### Key Entities

- **DashboardStatisticsDto**: métricas (label/valor/tendência/accent/icon), gráfico (forecast/realized
  × meses + yMax/yTicks), distribuição por centro de custo (id/label/valueCents/tone), fornecedores sem
  contrato (id/name/valorTotalCents) + limite de dispensa.
- **DashboardAggregations** (cru/INTERINO): as métricas primitivas, os arrays mensais, o group-by por
  centro de custo e a lista crua de fornecedores — a forma que o #112 entregará.

## Success Criteria

### Measurable Outcomes

- Todos os gates verdes: `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`
  (baseline lint 0 erros / 115 warnings).
- O Dashboard não regride visualmente (steady-state `ready` byte-idêntico; e2e visual `/dashboard`
  intacto).
- Nenhuma constante de dados hardcoded permanece no `dashboard-summary.view-model.ts`; a origem é o BFF.
- A troca pelo #112 toca **só** a FONTE (um arquivo), não a composição.
  </invoke>
