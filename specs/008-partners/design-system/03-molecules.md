# 03 · Molecules: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Nível**: Molecules (Atomic Design, Cap. 2)

> Grupos simples de átomos com propósito único (`shared/ui/molecules`). Sem lógica de negócio.

### `FormField` — rótulo + controle + erro
- **Composta de**: `Label` + (`TextInput`|`Select`|`DatePicker`|`TextArea`) + mensagem de erro
- **Props**: `{ label, control, error?, required?, readOnly? }`
- **Estados**: vazio · preenchido · erro · read-only (detalhe)
- **A11y**: associação label↔controle; `aria-describedby` no erro
- **Usado em**: FormCard

### `SearchField` — busca livre
- **Composta de**: `TextInput` (placeholder "Pesquise") + ícone
- **Comportamento**: emite `onSearch` (debounced); não decide regra
- **Usado em**: DataTable header, DualPanel (busca por painel)

### `PaginationControl`
- **Composta de**: `Select` (5/10/25) + contador "X – Y" + `IconButton` prev/next
- **Estados**: prev desabilitado na 1ª página; next desabilitado na última
- **Usado em**: DataTable

### `FilterToggle`
- **Composta de**: `IconButton` (funil, `aria-pressed`)
- **Comportamento**: abre/fecha o `FilterPanel`; não fecha ao aplicar filtro

### `StatusCell` — status duplo (colaboradores)
- **Composta de**: 2× `StatusBadge` (ativação + situação)
- **Usado em**: DataTable de colaboradores

### `SectionTitle`
- **Composta de**: título tipográfico de seção (ex.: "Dados pré-preenchidos pela ABC:")
- **Usado em**: FormCard (separa as 2/3 seções)

### `TransferListItem`
- **Composta de**: rótulo + `IconButton` (+/−) ou texto "Adicionado" (cinza) quando já incluído
- **Usado em**: DualPanel

### `ModalActions`
- **Composta de**: 2× `Button` (confirmar/cancelar) — hierarquia configurável (ação segura em destaque em financiadores)

## Cobertura vs. inventory

| Molécula | Coberta? |
|---|---|
| FormField / SearchField / PaginationControl / FilterToggle | ✅ |
| StatusCell / SectionTitle / TransferListItem / ModalActions | ✅ |
