# 00 · Interface Inventory: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Método**: Atomic Design (Frost), Cap. 4

> Foto crua de toda a UI das 5 telas antes de sistematizar. Expõe inconsistências e fixa o vocabulário
> e a política de fidelidade (clone fiel × sanear bug de borda).

## 1. Fonte da evidência

- `handbook/specs-desing-system/gestão de parceiros/{colaboradores,fornecedores,financiadores,estados,municipios}/`
  (`context.md` + `dom.md` + `screenshots.md`) + `evidencias_soltas/` (AppShell, dashboard, tokens).
- Telas: Colaboradores (listagem/detalhe/editar/adicionar), Fornecedores (idem), Financiadores (idem),
  Estados (dual-panel), Municípios (dual-panel + UF).

## 2. Inventário por categoria

| Categoria | Variações encontradas | Onde aparece | Consolidar como |
|---|---|---|---|
| Botões | primário ciano, outline, ícone (+/−/funil/back), destrutivo (coral) | todas | átomo `Button` (variants) + `IconButton` |
| Campos | textbox, combobox, datepicker, combobox c/ autocomplete, textarea (maxLength 500), file oculto | forms, filtros, municípios | átomos/moléculas `FormField` |
| Status | Ativo/Inativo (badge) + Cadastrado/Pré (situação) | listagens | molécula `StatusBadge` (+ duplo em colaboradores) |
| Tabela | colunas variáveis, linha clicável, `CONTRATOS/ADITIVOS` vazia | listagens | organismo `DataTable` |
| Paginação | select 5/10/25 + contador + prev/next | listagens | molécula `PaginationControl` |
| Filtros | painel toggle (funil), 11 campos (colab), 3 (forn), nenhum (financ) | listagens | organismo `FilterPanel` |
| Modais | desativar (com/sem Motivo), descartar alterações | editar/detalhe | organismos `DeactivateModal`, `ConfirmDiscardModal` |
| Dual-panel | esquerda/direita + transfer +/− + buscas indep. + (UF) | estados/municípios | organismo `DualPanel` |
| Navegação | AppShell, sidebar accordion "Gestão de Parceiros", breadcrumb, back | todas | shell + organismos |
| Form layout | 2 seções (colab), 3 seções (forn), 1 sem seção (financ) | adicionar/editar | organismo `FormCard` (n seções) |

## 3. Inconsistências detectadas

| # | Inconsistência | Telas | Decisão |
|---|---|---|---|
| 1 | Breadcrumb singular ("Fornecedor > Adicionar") vs plural na listagem | Fornecedores | **padronizar** (FR-013) |
| 2 | Encoding `AvaliaÃ§Ã£o` em vez de "Avaliação" | Colaboradores (DOM) | **sanear** na ACL (bug de API) |
| 3 | Modal desativar: ícone ⚠️ vermelho (colab) vs ℹ️ ciano (forn/financ) | 3 telas | **padronizar** ícone informativo; manter Motivo só em colaboradores |
| 4 | Hierarquia de botões invertida no modal (ação segura em destaque) | Financiadores | **manter** (decisão de UX deliberada) — documentar |
| 5 | Coluna `CONTRATOS/ADITIVOS` vazia | listagens | **manter** placeholder (reservada, FR-015) |

## 4. Política de fidelidade (clone fiel)

- **Replicar** (comportamento visível): status duplo, pré-cadastro 2 etapas, filtros toggle que não
  fecham, dual-panel imediato, Motivo obrigatório só em colaboradores, linha clicável.
- **Sanear** (bug de borda, não-UI): encoding mojibake; breadcrumb singular → padronizar. (ADR-0001)
- **Reservado** (placeholder): coluna CONTRATOS/ADITIVOS vazia.

## 5. Vocabulário compartilhado (saída)

`Button`, `IconButton`, `Badge`/`StatusBadge`, `FormField`, `SearchField`, `PaginationControl`,
`FilterToggle`, `DataTable`, `FilterPanel`, `FormCard`, `DualPanel`, `DeactivateModal`,
`ConfirmDiscardModal`, `Breadcrumb`, `BackButton`, `AppShell`/`Sidebar`. Nomeados por **papel/estrutura**.
