# 04 · Organisms: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Nível**: Organisms (Atomic Design, Cap. 2)

> Seções complexas da interface. Recebem dados/handlers da ViewModel (views burras, Princ. XI).
> Específicos da feature vivem em `modules/partners/client/ui`; reutilizáveis sobem para `shared/ui/organisms`.

### `DataTable` — listagem
- **Composto de**: cabeçalho (colunas), linhas (linha **clicável** → detalhe), `StatusCell`/`StatusBadge`, `PaginationControl`
- **Props**: `{ columns, rows, onRowClick, pagination, loading, empty }`
- **Estados**: vazio (empty state) · carregando (skeleton) · erro · paginado
- **Particularidades**: mantém coluna `CONTRATOS/ADITIVOS` vazia (FR-015); linha inteira clicável
- **A11y**: `role=table`, navegação por teclado, foco na linha
- **Usado em**: listagens de colaboradores/fornecedores/financiadores

### `FilterPanel` — filtros avançados (toggle)
- **Composto de**: N× `FormField` (selects/date/number) + `Button` "Filtrar"/"Exportar"
- **Variações**: 11 campos (colaboradores), 3 (fornecedores: status/categoria), ausente (financiadores)
- **Comportamento**: abre/fecha via `FilterToggle`; **não fecha ao aplicar**

### `FormCard` — formulário de detalhe/criar/editar
- **Composto de**: `SectionTitle` + grid de `FormField` + footer `ModalActions`/Button
- **Variações de seções**: 2 (colaboradores: "pré-preenchidos pela ABC" + "complete seu cadastro"),
  3 (fornecedores: cadastrais + bancários + PIX), 1 sem seção (financiadores)
- **Estados**: leitura (detalhe) · edição · criação · campo largo (Endereço ocupa a linha)

### `DualPanel` — transferência (estados/municípios)
- **Composto de**: 2 painéis (disponíveis/selecionados) + `SearchField` por painel + `TransferListItem` (+/−)
- **Variações**: Estados (27 UFs estáticas, sem filtro) · Municípios (filtro UF obrigatório via `Combobox` autocomplete; cross-state no painel direito)
- **Comportamento**: persistência **imediata** (sem Salvar; command → gateway, otimista); "Adicionado" cinza
- **A11y**: anúncio (aria-live) ao mover item

### `DeactivateModal`
- **Composto de**: ícone (informativo) + texto dinâmico ("...desativar o [tipo] [Nome].") + `ModalActions`
- **Variações**: com `Select` "Motivo" obrigatório (colaboradores — botão desabilitado até selecionar) · sem Motivo (fornecedores/financiadores) · hierarquia de botões invertida (financiadores)

### `ConfirmDiscardModal`
- **Texto**: "Ao confirmar essa opção todas as suas alterações serão perdidas."
- **Usado em**: cancelar edição

### `AppShell` / `Sidebar`
- **Composto de**: topbar (logo + saudação + avatar) + sidebar (accordion "Gestão de Parceiros" com 5 sub-itens; item ativo em accent) + `Breadcrumb` + `BackButton`
- **Reuso**: provavelmente já existe (layout autenticado) — partners só adiciona os itens de menu

## Cobertura vs. inventory

| Organismo | Coberto? | Escopo |
|---|---|---|
| DataTable / FilterPanel / FormCard / DualPanel | ✅ | `partners/client/ui` (candidatos a `shared/ui`) |
| DeactivateModal / ConfirmDiscardModal | ✅ | `partners` (DeactivateModal genérico → shared) |
| AppShell / Sidebar | ✅ | `shared/ui` (reuso) |
