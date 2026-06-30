# 03 · Molecules: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Nível**: Molecules (Atomic Design, Cap. 2)

> **Moléculas** = grupos simples de átomos funcionando como uma unidade com propósito (single
> responsibility: "faz uma coisa bem"). Ex.: SearchField (Label+Input+Button), FormField (Label+Input+
> erro), Pagination, FilterToggle, StatusCell. Vivem em `src/shared/ui/molecules/`. Compõem só átomos
> (e tokens). Ficha por molécula (Frost, Cap. 3).

## Lista de moléculas

### [`MoleculeName`] — [propósito único]
- **Reuso?**: [existe / novo]
- **Composta de (átomos)**: [`Label` + `TextInput` + `...`]
- **Props (API)**: `[{ … }]`
- **Comportamento**: [o que faz — ex.: "submit dispara onSearch"; sem lógica de negócio]
- **Variações/estados**: [vazio · preenchido · erro · disabled]
- **Tokens**: [...]
- **Acessibilidade**: [associação label/input, aria, teclado]
- **Usado em (linhagem)**: [organismos]
- **Evidência**: [ref]

---

[Repita. Ex.: SearchField, FormField (text/select/date/combobox-autocomplete), PaginationControl,
FilterToggle, StatusBadgeCell, SectionTitle, TransferListItem (+/−), ModalActions.]

## Cobertura vs. inventory

| Molécula do inventory | Coberta? | Documento |
|---|---|---|
| [...] | ✅/⬜ | [esta seção] |
