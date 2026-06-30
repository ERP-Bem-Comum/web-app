# 02 · Atoms: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Nível**: Atoms (Atomic Design, Cap. 2)

> Blocos elementares (`shared/ui/atoms`). Burros, só-tokens, nomeados pelo papel. A maioria deve **já
> existir** (reuso de `auth`/`contracts`); aqui marcamos reuso vs. novo.

### `Button` — ação
- **Reuso?**: provável existente (usado em auth/contracts)
- **Props**: `{ variant: 'primary'|'outline'|'destructive', size, disabled, loading, type }`
- **Estados**: default · hover · active · disabled · loading
- **Tokens**: `vars.color.accent` (primary), `vars.color.status.inactive` (outline), coral p/ destructive
- **A11y**: `role=button`, foco visível, `aria-busy` quando loading
- **Usado em**: ModalActions, FormCard footer, listagem ("Adicionar X")

### `IconButton` — ação compacta
- **Props**: `{ icon, label(aria), variant }` — `+` (verde), `−` (vermelho), funil (toggle), back (←)
- **Estados**: default · hover · active(toggle) · disabled
- **A11y**: `aria-label` obrigatório; `aria-pressed` no funil (toggle)
- **Usado em**: DualPanel, FilterToggle, BackButton, paginação

### `TextInput` / `NumberInput` / `TextArea`
- **Props**: `{ value, onChange, placeholder, disabled, invalid, maxLength }` (textarea: 500)
- **Estados**: vazio · preenchido · focus · erro · disabled (read em detalhe)
- **A11y**: associado a `Label` via id; `aria-invalid`

### `Select` / `Combobox` (com autocomplete)
- **Props**: `{ options, value, onChange, searchable, clearable }` — combobox de UF é searchable+clearable
- **Estados**: fechado · aberto · com seleção (× para limpar) · vazio ("Nenhum resultado encontrado")

### `DatePicker`
- **Props**: `{ value, onChange }` (início de contrato, nascimento)

### `StatusBadge` (átomo de exibição)
- **Props**: `{ kind: 'active'|'inactive'|'registered'|'pre-registered' }`
- **Tokens**: `vars.color.status.*`

### `Avatar`, `Spinner`, `Breadcrumb`, `Label`, `Checkbox`
- Reuso provável; documentar API mínima ao implementar.

## Cobertura vs. inventory

| Átomo | Coberto? | Reuso |
|---|---|---|
| Button / IconButton | ✅ | existente |
| TextInput / NumberInput / TextArea | ✅ | existente/extensão |
| Select / Combobox(autocomplete) | ✅ | combobox autocomplete pode ser novo |
| DatePicker / StatusBadge / Avatar / Spinner | ✅ | a confirmar |
