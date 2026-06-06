# 05 · Templates: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Nível**: Templates (Atomic Design, Cap. 2)

> Esqueleto/layout (sem conteúdo final). Um template ≈ o `*.page.tsx` burro que LIGA a ViewModel e
> compõe organismos. Foco em estrutura, não dados (isso é o doc 06).

### `ListTemplate` — listagem
- **Layout**: header (título + `SearchField` + `FilterToggle` + CTA "Adicionar") → `FilterPanel` (colapsável) → `DataTable` → `PaginationControl`
- **Organismos**: DataTable, FilterPanel
- **Guardrails**: colunas variam por entidade; coluna reservada CONTRATOS/ADITIVOS; itens/página 5/10/25
- **Slots dinâmicos**: colunas, conjunto de filtros, label do CTA
- **Mapeia para**: `<entidade>-list/*.page.tsx`
- **Rotas**: `/colaboradores`, `/fornecedores`, `/financiadores`

### `DetailTemplate` — detalhe/editar
- **Layout**: `BackButton` + `Breadcrumb` → `FormCard` (n seções, read|edit) → footer (Voltar/Cancelar + Editar/Salvar) + `DeactivateModal`/`ConfirmDiscardModal`
- **Guardrails**: nº de seções por entidade; campo largo (Endereço) ocupa a linha
- **Mapeia para**: `<entidade>-detail/` + `<entidade>-edit/`
- **Rotas**: `/<entidade>/detalhes/:id`, `/<entidade>/editar/:id`

### `CreateTemplate` — adicionar
- **Layout**: `BackButton` + `Breadcrumb` → `FormCard` (modo criação) → footer (Adicionar)
- **Variações**: colaboradores = pré-cadastro (7 campos, depois completa em editar)
- **Rotas**: `/<entidade>/adicionar`

### `DualPanelTemplate` — estados/municípios
- **Layout**: (Municípios: `Combobox` UF no topo) → `DualPanel` (2 painéis + buscas) — tela única, sem breadcrumb/back
- **Rotas**: `/estados`, `/municipios`

## Matriz template × comportamento

| Template | Comportamentos | Variações |
|---|---|---|
| ListTemplate | colaboradores, fornecedores, financiadores | com/sem FilterPanel; colunas |
| DetailTemplate | os 3 (detalhe + editar) | nº seções; Motivo no desativar |
| CreateTemplate | os 3 | pré-cadastro (colaboradores) |
| DualPanelTemplate | estados, municípios | filtro UF (municípios) |
