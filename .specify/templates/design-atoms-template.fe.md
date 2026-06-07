# 02 · Atoms: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Nível**: Atoms (Atomic Design, Cap. 2)

> **Átomos** = blocos elementares de UI que não se decompõem sem perder função (Button, Input, Label,
> Badge, Icon…). Vivem em `src/shared/ui/atoms/` (Atomic: `tokens ← atoms`). São burros, só-tokens,
> nomeados pelo papel. Ficha por átomo segue as qualidades de pattern library (Frost, Cap. 3):
> descrição, props, estados/variações, tokens, a11y, **linhagem** (onde é usado).

## Lista de átomos (novos ou reusados)

### [`AtomName`] — [papel]
- **Reuso?**: [já existe em `shared/ui/atoms` / novo]
- **Props (API)**: `[{ variant, size, disabled, … }]` — discriminated unions quando aplicável
- **Variações/estados**: [default · hover · active · disabled · loading · error]
- **Tokens usados**: [`vars.color.*`, `vars.space.*` — sem literal cru]
- **Acessibilidade**: [role, label, foco, contraste]
- **Usado em (linhagem)**: [moléculas/organismos que o compõem]
- **Evidência**: [ref do inventory/screenshot]

---

[Repita por átomo. Ex.: Button (variants primary/outline/icon/destructive), TextInput, Label,
StatusBadge, IconButton, Checkbox, BackButton, Avatar, Spinner.]

## Cobertura vs. inventory

| Átomo do inventory | Coberto? | Documento |
|---|---|---|
| [...] | ✅/⬜ | [esta seção] |
