# Spec 053 — Relatórios "Fluxo de Caixa" + "Relatório Geral" (fecha o épico #169/#114)

- **Tamanho:** M (duas telas de relatório, front-first, sem server function nova). Fecha o épico dos Relatórios.
- **Módulo:** `src/modules/reports/client/` (mesmo módulo dos relatórios existentes).
- **Rotas:** `/relatorios/fluxo-caixa` e `/relatorios/geral` (`src/routes/_authenticated/relatorios/*.tsx`).
- **Estado:** front-first — dados PLACEHOLDER sintéticos (LGPD: 100% fictícios, sem PII); endpoint core-api
  (#114) ainda não existe. Espelho fiel do legado (`ERP-BACKEND/src/modules/reports`).

## Objetivo

Entregar os **dois últimos relatórios** do módulo, fechando o épico #169/#114, no MOLDE de tela dos demais
(full-bleed 28px, `screen` da marca, cabeçalho com voltar + título + Filtros + Exportar, filtros recolhíveis,
export CSV/PDF via `report-export-dropdown`). RBAC **não gateia** (modelado pós-entrega).

### Relatório 1 — Fluxo de Caixa (`/relatorios/fluxo-caixa`)

Espelho de `reports/types/cashflow.ts` + `services/cashflow-report.service.ts`. Duas **SEÇÕES**:

- **Saídas** = payables + movimentação de cartão; **Entradas** = receivables.
- Cada seção é árvore **Categoria → Subcategoria** com 2 medidas: **Realizado (REALIZED)** × **Previsto
  (EXPECTED)**. Linha de **total por seção**; **Saldo = Entradas − Saídas** (realizado e previsto).
- **4 gráficos "Previsto × Realizado"** (espelho do legado), nesta ordem:
  1. **Linha do tempo** (line chart, 3 séries) — **Esperado** (ciano) · **Realizado** (verde) · **Saldo**
     (verde-claro) por PERÍODO (mês por vencimento). Esperado/Realizado = movimentação BRUTA do mês (Σ das 2
     medidas das 2 seções); Saldo = LÍQUIDO realizado (Entradas − Saídas), podendo negativar → escala inclui o
     zero + linha de base. Rótulos de período por ÍNDICE.
  2. **Agrupado por Centro de Custo** (barras verticais AGRUPADAS) — **Previsto** (ciano) × **Realizado**
     (verde) por Centro de Custo (agrega as SAÍDAS; CC é dimensão de despesa). Molde do gráfico agrupado do
     Fluxo.
  3. **Entradas** (donut) — 2 arcos **Previsto** × **Realizado** dos totais da seção Entradas; centro =
     execução (realizado ÷ previsto).
  4. **Saídas** (donut) — idem, da seção Saídas.
     Layout: linha do tempo (cheia) → CC (cheia) → Entradas + Saídas (2 colunas).
- **Empty-state pluggável:** Entradas hoje tem placeholder mínimo (validar); quando o Contas a Receber subir,
  a fonte de Entradas vira `[]` → a seção Entradas cai LIMPA no vazio ("Nenhuma entrada registrada") E o donut
  de Entradas (totais 0) cai no placeholder honesto — SEM quebrar Saídas nem o Saldo (que passa a `0 − Saídas`).
- **⚠️ Datas/meses derivados por índice/ordinal** — nunca a partir de string de data (bug "Invalid Date").
- **Export CSV fiel:** `Seção;Categoria;Subcategoria;Realizado;Previsto` (Saídas depois Entradas) + PDF.

### Relatório 2 — Relatório Geral (`/relatorios/geral`)

Espelho de `reports/types/generalReport.ts` + `dtos/response/generalReportResponse.dto.ts`. **Ledger unificado
ACHATADO e PAGINADO** — uma linha por movimento, cruzando payable/receivable/cartão/contrato/apontamento.
Colunas (as do legado, PT): **Data · Vencimento · Tipo · Nº Contrato · Código · Parcela · Apontamento ·
Fornecedor · Financiador · Colaborador · Centro de Custo · Categoria · Subcategoria · PIX/Bancário · Valor**.
Nem toda linha preenche todas (nullable → "—" na exibição; campo vazio no CSV).

- **Tabela paginada** (reuse `BrandPaginator`, 10/pág; opções 5/10/25) com **scroll horizontal**
  (`overflow-x:auto`, muitas colunas). Filtros recolhíveis + Exportar CSV/PDF.
- **Empty-state pronto:** "Nenhum lançamento no período" (quando filtrar/esvaziar).
- As linhas de **receivable/financiador** são placeholder até o Contas a Receber subir (core-api#114).

## Escopo funcional (de cima p/ baixo)

**Fluxo de Caixa:** cabeçalho → filtros recolhíveis (Programa, Plano, Período, Conta, Centro, Categoria,
**Subcategoria**, **Status** — este alinhado ao Contas a Pagar, reusando os chips do CAP + a allOption) →
4 KPIs (Total de Saídas · Total de Entradas · Saldo realizado · Saldo previsto) → **4 gráficos "Previsto ×
Realizado"** (Linha do tempo → Agrupado por Centro de Custo → donuts Entradas + Saídas) → seção Saídas (tree)
→ seção Entradas (tree ou empty-state).

**Relatório Geral:** cabeçalho → filtros recolhíveis (Período, Tipo, Fornecedor, Centro, Categoria) → tabela
paginada (15 colunas, scroll horizontal) → `BrandPaginator`.

## Fora de escopo

- Filtragem real (os selects são placeholders visuais front-first).
- Server function / endpoint core-api (#114) — entra quando o BFF entregar o DTO.
- RBAC do relatório (modelado pós-entrega).

## Critérios de aceite

- [x] `loadFluxoCaixa()` PURO: 2 seções (Cat→Sub × Realizado/Previsto), total por seção, Saldo = Entradas −
      Saídas; seção Entradas = [] → seção vazia SEM quebrar Saídas/Saldo; série mensal por vencimento.
- [x] Derivações PURAS dos 4 gráficos: `buildTimeline` (Esperado/Realizado/Saldo por período; Saldo pode
      negativar), `aggregateByCostCenter` (Previsto × Realizado por CC, das Saídas, desc por Realizado),
      `sectionDonutData`/`executionPercent` (donuts). Todas node:test-áveis; guard "Invalid Date" mantido.
- [x] 4 gráficos na page (Linha do tempo, Agrupado por Centro de Custo, donuts Entradas + Saídas) + os 2
      filtros novos (Subcategoria, Status alinhado ao CAP). Donut de Entradas vazia → placeholder honesto.
- [x] `loadRelatorioGeral()` + `buildCsv` + paginação PUROS; nullable → campo vazio no CSV; datas já
      formatadas (nunca "Invalid Date").
- [x] Duas rotas + public-api + menu (2 subitens) + `PAGE_TITLES` (2 títulos) + i18n (`reports.fluxoCaixa.*`,
      `reports.geral.*`).
- [x] Views BURRAS (props/i18n); ViewModels agnósticos de framework (sem `react`/`@tanstack/react-*`).
- [x] Cor por dado via `styleVariants` sobre `brand.color.fluxo.*` (§X só-tokens); nenhum hex/px cru fora do
      `*.values.ts`.
- [x] Gates verdes: `pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`
      (lint 0 erros / 115 warnings baseline).
