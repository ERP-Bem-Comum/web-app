# Feature Specification: Relatório "Realizado × Planejado"

**Feature Branch**: `feat/reports-suppliers-without-contract` (segundo relatório na mesma leva)

**Created**: 2026-07-06

**Status**: Draft (front-first / placeholder-data)

**Input**: Segundo relatório do módulo Relatórios do web-app v2 — matriz "Realizado × Planejado"
(Realizado vs Planejado por Centro de Custo → Categoria → Subcategoria × 12 meses), estilizado no padrão
visual da matriz Consolidado ABC (coluna congelada + árvore + tokens brand), enquanto o endpoint do
core-api (#114) não existe.

> **Variante `-fe` (frontend / web-app).** Descreve o **quê** (jornada, requisitos, critérios). O **como**
> (novos arquivos no módulo `reports`, MVVM puro, matriz sticky com scroll interno, 3 gráficos SVG,
> export client-side) fica no `plan.md`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar Realizado × Planejado na matriz (Priority: P1)

Como analista de planejamento, quero ver, em uma matriz, os valores PROVISIONADO / REALIZADO / PLANEJADO
por Centro de Custo → Categoria → Subcategoria e por mês, com AV% do planejado, para acompanhar a execução
orçamentária.

**Why this priority**: é o núcleo do relatório — a matriz com o comparativo é o que entrega valor.

**Independent Test**: acessar `/relatorios/realizado-x-planejado` e ver a matriz com os 7 centros de custo,
o grupo congelado à esquerda (Centro de Custo · Provisionado · Realizado · Planejado · AV%), os grupos de
mês em ordem DECRESCENTE (DEZ/26 … JAN/26) cada um com 3 sub-colunas, e a linha de totais no topo.

**Acceptance Scenarios**:

1. **Given** a tela carregada, **When** a matriz renderiza, **Then** o grupo esquerdo (Centro de Custo +
   Provisionado/Realizado/Planejado/AV%) fica CONGELADO ao rolar horizontalmente pelos meses.
2. **Given** um centro de custo, **When** clico no chevron, **Then** vejo Categoria (nível 1) e, expandindo
   de novo, Subcategoria (nível 2), recuadas.
3. **Given** a matriz, **When** rolo horizontal/vertical, **Then** o scroll acontece DENTRO do contêiner da
   matriz — a página NÃO ganha barras de rolagem nem "perde" as colunas de mês.
4. **Given** uma linha com Realizado 0, **When** olho a coluna AV%, **Then** vejo "0%".

---

### User Story 2 - Alternar Gráfico ⇄ Tabela (Priority: P2)

Como analista, quero alternar entre a matriz e uma visão de gráficos (distribuição por centro de custo,
distribuição mensal, realizado vs previsto) para ler a mesma informação de forma agregada.

**Why this priority**: complementa o P1; a matriz já entrega valor sem os gráficos.

**Independent Test**: clicar em "Gráfico" → aparecem 3 gráficos (donut por CC, barras horizontais por mês,
donut realizado vs previsto), com rótulos LEGÍVEIS (sem sobreposição) e uma animação discreta de entrada;
clicar em "Tabela" volta à matriz.

**Acceptance Scenarios**:

1. **Given** a visão Tabela, **When** clico "Gráfico", **Then** vejo os 3 gráficos e o botão passa a "Tabela".
2. **Given** a visão Gráfico, **When** os gráficos montam, **Then** os arcos do donut e as barras crescem
   com transição discreta (~400-600ms ease-out).

---

### User Story 3 - Exportar o relatório (Priority: P3)

Como analista, quero exportar em CSV (uma linha por CC/Cat/Subcat × mês, delimitado por `;`, valores
`"R$ x.xxx,xx"`) e em PDF (impressão) para prestação de contas.

**Independent Test**: Exportar → CSV baixa arquivo com o cabeçalho legado
`Centro de Custo;Categoria;Subcategoria;Nome do Mês;Valor Esperado;Valor Realizado;Valor Provisionado`;
Exportar → PDF abre `window.print()`.

### Edge Cases

- Planejado = 0 numa linha → AV% guarda divisão por zero e mostra "0%" (nunca NaN/Infinity).
- Realizado/Provisionado são dados DEMO (o legado real é 0) — deixados explícitos por comentário no código;
  virão da Conciliação/Contratos quando o backend existir.
- Meses: matriz em ordem DECRESCENTE (DEZ→JAN); gráfico mensal em ordem ASCENDENTE (JAN→DEZ).

## Requirements _(mandatory)_

- **FR-1**: matriz CC→Cat→Subcat × 12 meses, 3 medidas (provisionado/realizado/planejado) em centavos.
- **FR-2**: grupo esquerdo STICKY (congelado) + scroll horizontal/vertical INTERNO ao contêiner.
- **FR-3**: AV% = realizado/planejado×100 (guard ÷0 → 0), por linha e no total.
- **FR-4**: toggle Gráfico ⇄ Tabela (UI-state local).
- **FR-5**: 3 gráficos SVG (2 donuts + 1 barras horizontais) com legendas legíveis e animação discreta.
- **FR-6**: export CSV (fiel ao legado) + PDF (`window.print()`).
- **FR-7**: todo texto ao humano via i18n; só-tokens no CSS; MVVM (ViewModel pura, views burras).

## Success Criteria

- `pnpm verify` verde (typecheck + lint 0 erros + testes node/dom).
- Placeholder com os 7 centros de custo e valores Planejado fiéis ao CSV legado; Realizado/Provisionado DEMO.
- Página não rola; a matriz rola internamente.
