# Feature Specification: Relatórios — ligar 3 telas aos endpoints reais (épico core-api #114)

**Feature Branch**: `073-reports-real-endpoints`

**Created**: 2026-07-14

**Status**: Draft

**Input**: Ligar 3 relatórios do web-app (Equipe ABC · Fornecedores sem Contrato · Posição de Pagamentos)
aos endpoints REAIS do core-api que subiram na `dev` (épico #114: #238/#240/#243). Hoje as 3 telas são
alimentadas por placeholder sintético; trocar a FONTE pela cadeia real, criando a camada `server/` do módulo.

## User Scenarios & Testing

### User Story 1 - Posição de Pagamentos real (Priority: P1)

Como gestor financeiro, ao abrir **Relatórios → Posição de Pagamentos**, quero ver a árvore
Fornecedor → Centro de Custo → Categoria com os 3 baldes (Em atraso · Pago · A pagar) calculados sobre os
lançamentos REAIS, para tomar decisão sobre a real posição das obrigações.

**Why this priority**: mapeamento 1:1 do DTO real ao shape já consumido pela tela (linha por
fornecedor×centro×categoria com 3 baldes) — maior valor, menor risco. É o caso que valida a cadeia inteira.

**Independent Test**: abrir `/relatorios/posicao-pagamentos` e ver os valores reais na árvore/gráfico/CSV;
loading enquanto busca; empty-state honesto quando o backend devolve `[]`; erro tratado.

**Acceptance Scenarios**:

1. **Given** o core-api tem posições, **When** abro a tela, **Then** a árvore soma folha→CC→fornecedor→Total
   com Em atraso=overdueCents, Pago=paidCents, A pagar=pendingCents.
2. **Given** o backend devolve lista vazia, **When** abro a tela, **Then** vejo o empty-state existente (não erro).
3. **Given** o BFF devolve erro, **When** abro a tela, **Then** vejo o estado de erro (tag i18n), nunca status HTTP.

---

### User Story 2 - Fornecedores sem Contrato real (Priority: P2)

Como gestor, quero ver os fornecedores SEM contrato com o total gasto real e a matemática do limite, para
identificar quem precisa de contrato formal.

**Why this priority**: valor direto de compliance; porém o endpoint entrega total AGREGADO por fornecedor
(+ `payableCount`), SEM a quebra por plano orçamentário que o placeholder tinha (gap documentado abaixo).

**Independent Test**: abrir a tela e ver os fornecedores reais com total e % do limite; gráfico de compliance
e CSV coerentes; loading/empty/erro preservados.

**Acceptance Scenarios**:

1. **Given** o core-api lista fornecedores, **When** abro a tela, **Then** cada fornecedor mostra `totalCents`
   real e a matemática do limite (utilizado %, restante, estouro) sobre esse total.
2. **Given** um fornecedor sem nome (`name: null`), **When** exibido, **Then** cai no `supplierRef` como rótulo.

---

### User Story 3 - Equipe ABC real (Priority: P3)

Como gestor de pessoas, quero ver a Equipe com os dados reais LGPD-safe (nome, área/programa, função, vínculo,
escolaridade, ano de contrato, situação cadastral, ativo, experiência no setor público).

**Why this priority**: o endpoint é LGPD-safe (9 colunas) e NÃO carrega idade/gênero/raça-cor — 3 dos 5
gráficos da tela (Gênero · Raça/Cor · Idade) não têm fonte real (gap documentado). O valor real está na
tabela + CSV + gráficos de Função e Ano de Contrato.

**Independent Test**: abrir `/relatorios/equipe` e ver a tabela/CSV/gráficos suportados com dados reais;
os gráficos demográficos caem no empty-state honesto; loading/erro preservados.

**Acceptance Scenarios**:

1. **Given** o core-api lista a equipe, **When** abro a tela, **Then** a tabela, o CSV, o gráfico de Função
   (por `role`) e o de Ano de Contrato (por `startOfContract`) refletem os dados reais.
2. **Given** o endpoint não traz idade/gênero/raça-cor, **When** abro a tela, **Then** os 3 gráficos
   demográficos exibem o empty-state honesto ("dado não disponível"), sem inventar distribuição.

### Edge Cases

- Lista vazia (`[]`) do backend → empty-state existente de cada tela, nunca erro.
- Erro do BFF → `ReportsError` → tag i18n; a UI nunca olha status HTTP (§V).
- Loading enquanto a query resolve (as 3 telas hoje são síncronas; ganham estado de carregamento).
- Campos nullable do DTO (name/program/education/refs) → fallback de rótulo ("—" / ref).

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE buscar cada relatório por uma server function própria (`*.query.fn.ts`), a única
  fronteira client↔server, com a sessão checada no HANDLER (não na rota).
- **FR-002**: O sistema DEVE validar a resposta do core-api na borda (Zod) e traduzir DTO→Model por mapper
  PURO (anti-corrupção), com drift → erro-valor `server` (nunca throw propagado).
- **FR-003**: O sistema DEVE preservar as VIEWS, filtros, export (CSV) e empty-states já existentes — trocando
  só a FONTE (placeholder → query real).
- **FR-004**: O sistema DEVE manter em placeholder os relatórios/recortes SEM endpoint (ex.: Posição/Análise de
  **Recebimentos** = A-Receber; quebra por plano de Fornecedores; demografia de Equipe).
- **FR-005**: Dinheiro chega como `*Cents` (number) e DEVE ser formatado com os utilitários de money já usados
  em cada tela (centavos inteiros, pt-BR).

### Key Entities

- **TeamMember** (GET /reports/team · perm COLLABORATOR.read): id, name, program?, role,
  employmentRelationship, startOfContract, registrationStatus, active, education?, experienceInPublicSector?.
- **SupplierWithoutContract** (GET /reports/suppliers-without-contract · FINANCIAL.read): supplierRef, name?,
  totalCents, payableCount.
- **PaymentPosition** (GET /reports/payment-position · FINANCIAL.read): supplierRef?, supplierName?,
  costCenterRef?, costCenterName?, categoryRef?, categoryName?, pendingCents, paidCents, overdueCents.

## Success Criteria

### Measurable Outcomes

- **SC-001**: As 3 telas exibem dados reais do core-api (sem placeholder na fonte principal), com
  loading/empty/erro preservados.
- **SC-002**: `pnpm verify` + `pnpm build` verdes; baseline de testes preservado (node 1410, dom 521) + novos.
- **SC-003**: Zero PII real em testes/fixtures (LGPD) — fixtures continuam sintéticas.

## Impacto Arquitetural (web-app / BFF)

- **Módulo afetado**: estende `src/modules/reports/` criando a camada `server/` (hoje só tem `client/` +
  `public-api/`). Espelha `src/modules/financial/server/`.
- **Server functions novas**: `get-team-report.query.fn.ts`, `get-suppliers-without-contract.query.fn.ts`,
  `get-payment-position.query.fn.ts` — todas GET, sem input, Result completo por caso de uso.
- **Integração core-api**: 3 GET em `/api/v2/reports/*`, sem query params (filtro é client). Base/headers via
  `coreApiBase` + `resultFetch` (mesma infra do `financial/server`).
- **Novos VOs**: não — read-models de leitura; tipos de I/O puros + mappers.
- **Design System**: só composição de existentes (nenhum átomo novo).
- **Possíveis violações**: nenhuma prevista; atenção ao boundary `client ↛ server/domain` (client só chama a
  server-fn via `data/repository`).

## Assumptions

- Os contratos dos 3 endpoints são os LIDOS do core-api mergeado (ADR-0027) e estáveis.
- O front só precisa mandar o token válido; o core-api aplica a permissão (403 → `forbidden`).

## Out of Scope

- Posição/Análise de **Recebimentos** (A-Receber) — sem endpoint; segue placeholder.
- Quebra por plano orçamentário em Fornecedores sem Contrato (o endpoint não a fornece).
- Gráficos demográficos de Equipe (idade/gênero/raça-cor) — endpoint LGPD-safe não os fornece.
- Filtros server-side (as telas filtram client-side; endpoints não recebem params).
