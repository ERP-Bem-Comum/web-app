# Feature Specification: Relatório "Fornecedores sem Contrato"

**Feature Branch**: `044-relatorio-fornecedores-sem-contrato`

**Created**: 2026-07-05

**Status**: Draft (front-first / placeholder-data)

**Input**: Reproduzir o relatório legado "Fornecedores sem Contrato" no web-app v2, estilizado com o kit
"brand" (mesmo modelo visual do grid de Colaboradores), enquanto o endpoint do core-api (#114) não existe.

> **Variante `-fe` (frontend / web-app).** Descreve o **quê** (jornada, requisitos, critérios). O **como**
> (módulo `reports`, MVVM puro, tree-table brand, export client-side) fica no `plan.md`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar pagáveis sem contrato por fornecedor (Priority: P1)

Como analista financeiro, quero ver, agrupados por fornecedor e por plano orçamentário, os valores de
pagáveis que **não** têm contrato vinculado, comparados a um **limite** configurável, para identificar
rapidamente fornecedores que estouraram o limite (compliance).

**Why this priority**: é o núcleo do relatório — sem a árvore fornecedor→plano com o comparativo de limite,
a tela não entrega valor.

**Independent Test**: acessar `/relatorios/fornecedores-sem-contrato` e ver a árvore com os 12 fornecedores
placeholder, os totais por plano, o % utilizado e o restante; alterar o **Limite** e ver a matemática (%,
restante, linha em vermelho quando estoura) recalcular.

**Acceptance Scenarios**:

1. **Given** o limite padrão R$ 10.000,00, **When** a tela carrega, **Then** cada fornecedor mostra VALOR
   TOTAL (soma dos planos), TOTAL UTILIZADO (%) e TOTAL RESTANTE; fornecedores com total > limite ficam
   em linha vermelha (danger).
2. **Given** um fornecedor expandido, **When** clico no chevron, **Then** vejo as linhas-filhas (planos
   orçamentários) recuadas com o total de cada plano.
3. **Given** o campo Limite, **When** troco para R$ 5.000,00, **Then** o %, o restante e o estado de
   estouro recalculam para todos os fornecedores.

---

### User Story 2 - Exportar o relatório (Priority: P2)

Como analista, quero exportar o relatório em CSV (delimitado por `;`, uma linha por fornecedor→plano) e em
PDF (impressão da tabela) para anexar em prestações de contas.

**Why this priority**: complementa o P1; a consulta na tela já entrega valor sem o export.

**Independent Test**: clicar em Exportar → CSV baixa um arquivo com o cabeçalho
`"Fornecedor";"BudgetPlan";"Total"`; Exportar → PDF abre a impressão do navegador.

**Acceptance Scenarios**:

1. **Given** a tela carregada, **When** clico Exportar → CSV, **Then** o navegador baixa um `.csv` com uma
   linha por par fornecedor→plano e o total agregado (R$).
2. **Given** a tela carregada, **When** clico Exportar → PDF, **Then** abre `window.print()`.

### Edge Cases

- Fornecedor exatamente no limite (100%) → NÃO é danger (regra é `> limite`, estrito).
- TOTAL RESTANTE negativo → exibe "-R$ 2.981,85" (fornecedor que estourou).
- % com menos de 2 dígitos inteiros → zero-pad ("03,52%", "00,11%").
- Filtros (Programa, Plano, Período, Centro/Categoria/Subcategoria de custo) sem fonte de dados ainda →
  são placeholders visuais; só o **Limite** afeta a tela.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma árvore fornecedor → plano orçamentário com VALOR TOTAL, TOTAL
  UTILIZADO (%) e TOTAL RESTANTE por fornecedor.
- **FR-002**: O sistema DEVE marcar em vermelho (danger) os fornecedores cujo VALOR TOTAL **excede** o
  limite (estritamente maior).
- **FR-003**: O usuário DEVE conseguir alterar o **Limite** (currency, padrão R$ 10.000,00) e ver a
  matemática recalcular.
- **FR-004**: O sistema DEVE formatar moeda em BRL e percentual com 2 dígitos inteiros zero-padded + 2
  decimais + "%".
- **FR-005**: O usuário DEVE conseguir exportar CSV (delimitado por `;`) e PDF (impressão).
- **FR-006**: A tela DEVE usar o kit visual "brand" (header, toolbar de filtros, tree-table) e ser
  full-bleed (28px), coerente com o grid de Colaboradores.
- **FR-007**: Todo texto ao humano DEVE vir de i18n (sem literais hardcoded na view).

_Marcação de incerteza:_

- [NEEDS BACKEND]: dados reais (`GET` pagáveis sem contrato) — core-api#114 ainda não existe. Enquanto
  isso, a tela usa constantes placeholder fiéis ao CSV legado.

### Non-Functional

- MVVM (§XI): a matemática/agregação vive na ViewModel **pura** (sem React). A View é burra.
- só-tokens (§X): sem hex/px cru em `*.css.ts`.
- Sem RBAC nesta tela (o relatório não tem `requiredPermission`).
