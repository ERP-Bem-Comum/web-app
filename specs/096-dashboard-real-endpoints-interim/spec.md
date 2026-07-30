# Feature Specification: Dashboard — de-interim dos endpoints reais

**Feature Branch**: `096-dashboard-real-endpoints-interim`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "dashboard real endpoints de-interim — ligar o Resumo Mensal aos endpoints que o core-api#112 (+#241/#242/#237) entregou, no lugar da fonte placeholder."

## Contexto

O Dashboard ("Resumo Mensal") entrega hoje um `DashboardStatisticsDto` COMPLETO por caso de uso
(§III), mas as agregações cruas (`DashboardAggregations`) vêm de uma **fonte placeholder** isolada
(`dashboard-statistics.placeholder-source.ts`), plugada na composição com o comentário
_"placeholder até core-api#112"_ (`financial.composition.ts:49`). O widget **Últimos pagamentos** já
foi ligado ao real em separado (`GET /financial/dashboard/recent-payments`, #239) e **não** faz parte
desta feature.

O core-api entregou no `origin/dev` os endpoints que faltavam (todos gated por `reference:read`):

| Endpoint (core-api)                                 | Ticket         | Entrega                                                                                    |
| --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `GET /financial/dashboard/cost-centers`             | #241 + #237    | `totalExpenses`, `variation` (M-1 vs M-2), `topCostCenter`, `distribution[]` (centavos)    |
| `GET /financial/dashboard/no-contract-suppliers`    | #242           | `suppliers[]` (`supplierRef`, `name`, `totalCents`) top-5                                  |
| `GET /reports/dashboard/realized?budgetPlanId&year` | #112 (DASH-F4) | `chart[12]` com `expectedCents`/`realizedCents` por mês (Previsto × Realizado de UM plano) |

A arquitetura já foi desenhada para este momento: ao ligar o #112 **troca-se SÓ a fonte** — a
composição pura (`dashboard.composition.ts`) permanece. Esta feature é essa troca, fatiada por
widget para entregar valor incrementalmente.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - KPI de Despesas + Distribuição por Centro de Custo reais (Priority: P1)

Como gestor financeiro, ao abrir o Dashboard quero ver as **despesas do mês** com sua **variação real**
(M-1 vs M-2), o **centro de custo com maior gasto** e o **donut de distribuição por centro de custo**
com números vindos do core-api — não mais zerados.

**Why this priority**: É o maior ganho num único endpoint (`/financial/dashboard/cost-centers`), sem
depender de nenhuma seleção de plano/ano. Cobre 2 dos 4 KPIs (Despesas + Top Centro) e o donut inteiro.

**Independent Test**: Com o driver do read-model ligado e títulos pagos em M-1/M-2 no seed, abrir o
Dashboard e verificar que o card Despesas mostra o total real e a variação, o card Top Centro mostra o
CC real, e o donut reflete a `distribution` do endpoint (ordem e percentuais).

**Acceptance Scenarios**:

1. **Given** títulos pagos em M-1 no read-model, **When** a tela carrega, **Then** o card "Despesas"
   mostra `totalExpenses` formatado e a tendência formatada a partir de `variation.percentage`.
2. **Given** a variação é `kind: 'new'` ou `'no-change'`, **When** a tela carrega, **Then** a legenda de
   tendência reflete o caso da união discriminada (sem inventar percentual).
3. **Given** `distribution` com N centros, **When** a tela carrega, **Then** o donut usa os 4 tons
   `dash.*` na ordem rankeada (desc por `totalCents`) e agrega o excedente coerente com o legado.
4. **Given** `topCostCenter` é `null` (sem despesa paga em M-1), **When** a tela carrega, **Then** o card
   Top Centro mostra o estado vazio previsto, sem quebrar.

---

### User Story 2 - Fornecedores sem Contrato reais (Priority: P2)

Como gestor, quero ver no Dashboard os **top-5 fornecedores sem contrato** por total pago, com dados
reais do core-api, para dirigir a régua de compliance (barras coloridas pelo limite de dispensa).

**Why this priority**: Endpoint dedicado e simples (`/financial/dashboard/no-contract-suppliers`), sem
input. Complementa o widget de compliance que hoje está zerado.

**Independent Test**: Com fornecedores sem contrato no read-model, abrir o Dashboard e conferir que a
lista mostra nome + total reais, ordenados por total desc, e as barras coloridas seguem o
`dispenseLimitCents`.

**Acceptance Scenarios**:

1. **Given** o endpoint retorna 5 fornecedores, **When** a tela carrega, **Then** a lista exibe
   `name` (ou fallback quando `name` é `null`) e `totalCents` real, na ordem recebida.
2. **Given** o endpoint retorna `suppliers: []`, **When** a tela carrega, **Then** o widget mostra o
   estado vazio, sem quebrar.

---

### User Story 3 - Gráfico Realizado × Previsto real, com seletor de plano (Priority: P3)

Como gestor, quero o gráfico mensal **Previsto × Realizado** do Dashboard alimentado pelos planos
**aprovados e vigentes** (mesmo ano do realizado comparado), podendo **escolher um plano** por um
dropdown OU ver **todos os aprovados vigentes somados** (padrão).

**Why this priority**: É o único que **exige input** (`budgetPlanId` + `year`) e envolve mais decisão de
produto (qual plano, agregação de vários). O endpoint `/reports/dashboard/realized` é **por 1 plano** →
o "todos somados" é fan-out no BFF (uma chamada por plano aprovado vigente, somando as 12 posições).

**Independent Test**: Com ≥2 planos aprovados do ano corrente populados, abrir o Dashboard e verificar
que o gráfico mostra por padrão a **soma** das séries dos planos aprovados; trocar no dropdown para um
plano específico e ver as séries daquele plano; conferir a conversão centavos → REAIS.

**Acceptance Scenarios**:

1. **Given** existem N planos APROVADOS vigentes no ano, **When** a tela carrega, **Then** o gráfico
   mostra a **soma** mês a mês (12 posições) de `expectedCents`/`realizedCents` dos N planos (padrão
   "Todos (somados)"), convertida para REAIS.
2. **Given** o dropdown lista "Todos (somados)" + cada plano aprovado vigente, **When** a pessoa escolhe
   um plano específico, **Then** o gráfico re-consulta e passa a mostrar só as séries daquele plano —
   **sem** refetchar os demais widgets (query própria do gráfico).
3. **Given** nenhum plano aprovado vigente no ano (ou o read indisponível → 503), **When** a tela
   carrega, **Then** o gráfico mostra o estado vazio/indisponível, sem derrubar os demais widgets.
4. **Given** um dos N planos falha no fan-out do "todos somados", **When** a soma é montada, **Then** o
   comportamento é honesto (não somar um plano faltante como zero silencioso — ver Assumptions).

---

### Edge Cases

- **Driver não setado**: módulo responde 200 com dados vazios (fallback silencioso do core-api — ver
  nota de projeto). Antes de caçar bug no front, conferir os `*_DRIVER` no ambiente.
- **Métricas sem endpoint**: `revenue` (Receita) e `topFinancier` (Maior financiador) **não têm**
  endpoint no dashboard do core-api. Ficam FORA do escopo real (permanecem placeholder honesto) e viram
  handoff — ver Assumptions.
- **Unidades divergentes**: donut e fornecedores vêm em **centavos**; o gráfico Realizado×Previsto vem
  em **centavos** mas o eixo Y da View é em **REAIS** — a composição converte. Não vazar centavos crus
  pro gráfico.
- **Falha parcial**: um widget indisponível (ex.: gráfico em 503) não pode derrubar os widgets que
  carregaram com sucesso.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O BFF DEVE consumir `GET /financial/dashboard/cost-centers` e mapear `totalExpenses`,
  `variation`, `topCostCenter` e `distribution` para as agregações cruas do Dashboard (métrica Despesas,
  métrica Top Centro e donut de distribuição).
- **FR-002**: O BFF DEVE consumir `GET /financial/dashboard/no-contract-suppliers` e mapear `suppliers[]`
  para `suppliersWithoutContract` (preservando a ordem/rank do backend).
- **FR-003**: O BFF DEVE consumir `GET /reports/dashboard/realized` com `budgetPlanId` + `year` e mapear
  `chart[12]` para as séries `monthlyForecast`/`monthlyRealized` (centavos → REAIS na composição).
- **FR-004**: A composição pura (`dashboard.composition.ts`) e o `DashboardStatisticsDto` DEVEM
  permanecer o contrato da View — só a **fonte** de agregações muda; a View não sofre alteração.
- **FR-005**: Cada resposta do core-api DEVE ser validada por Zod na borda (`dashboard.schema.ts`),
  nunca no domínio (§IX). Erro de validação/HTTP vira valor (`Result`), sem `throw`.
- **FR-006**: O sistema DEVE degradar por widget — um endpoint indisponível não pode impedir os demais
  widgets de renderizar.
- **FR-007**: As métricas sem endpoint (`revenue`, `topFinancier`) DEVEM ser exibidas de forma honesta
  (estado interino explícito), não como número real fabricado.
- **FR-008**: O acesso é gated por `reference:read`; 403 DEVE surfar como "sem permissão", coerente com o
  restante do financeiro.

### Key Entities

- **DashboardAggregations** (raw): contrato interno entre a fonte e a composição. Passa da fonte
  placeholder para a fonte real composta a partir dos 3 endpoints. Pode precisar de ajuste de forma
  (ex.: métrica em centavos + variação como união discriminada, em vez de string pré-formatada) — a
  decisão fica no plano.
- **DashboardStatisticsDto** (composto): resposta pronta que a server fn entrega. NÃO muda de forma.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Nos widgets ligados, 0% dos valores exibidos vêm do placeholder — todos derivam de
  resposta real do core-api (verificável no network + na tela).
- **SC-002**: O `DashboardStatisticsDto` mantém a mesma forma (a View não muda) — os testes de
  composição existentes continuam verdes.
- **SC-003**: Falha de um widget (ex.: gráfico em 503) não derruba os demais — o Dashboard renderiza os
  widgets bem-sucedidos.
- **SC-004**: `pnpm verify` + `pnpm test:dom` verdes (regressão zero).

## Impacto Arquitetural (core-api) _(obrigatório se a feature toca `src/`)_

- **Bounded Contexts afetados**: [x] Financeiro (`fin_*`) — consumo apenas (read). Nenhuma escrita.
- **Novos agregados / Value Objects?**: N/A (só consumo; composição já existe).
- **Novos eventos de domínio (outbox)?**: N/A.
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: Sim, do lado do **web-app** (server fn = única fronteira). O core-api já
  expõe os endpoints; nada muda no core-api.
- **Possíveis violações da constituição (I–VIII)?**: Nenhuma prevista — feature aditiva de consumo,
  mantém "erros como valores", Zod na borda, token nunca no browser.

## Assumptions

- **Escolha do plano/ano do gráfico (US3)**: assume-se o **ano corrente** e um plano orçamentário
  padrão/ativo da organização. Se nenhum casar, o gráfico cai no estado vazio. O critério exato de
  seleção do plano é ponto de decisão do plano (`plan.md`) — pode virar seleção fixa (interina) antes de
  um seletor.
- **`revenue` e `topFinancier` seguem placeholder**: não há endpoint de dashboard para Receita nem para
  Maior Financiador. Escopo desta feature = os 3 endpoints existentes. As duas métricas restantes viram
  **handoff (GitHub issue no core-api)** e permanecem interinas na tela.
- **Read-models populados**: os widgets dependem do worker de projeção (`fin_payable_view`) ter rodado;
  ambiente sem worker/driver mostra vazio legítimo (não é bug de front).
- **`recent-payments` fora de escopo**: já ligado ao real (#239) em feature anterior.
- **Base da branch**: idealmente sobre `go-live-front` (branch de produção do front). Reancorar antes do
  PR se necessário.
