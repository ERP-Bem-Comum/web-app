# 04 · Organisms: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Nível**: Organisms (Atomic Design, Cap. 2)

> **Organismos** = seções relativamente complexas da interface, compostas de moléculas/átomos/outros
> organismos (DataTable, FilterPanel, FormCard, DualPanel, DeactivateModal, AppShell). Estabelecem
> padrões reutilizáveis e dão contexto. Vivem em `src/shared/ui/organisms/` (ou no `modules/*/client/ui`
> quando específicos da feature). Ficha por organismo (Frost, Cap. 3) — com **linhagem** e variações.

## Lista de organismos

### [`OrganismName`] — [seção da interface]
- **Reuso?**: [existe / novo] · **Escopo**: [`shared/ui` global / `modules/<m>/client/ui` local]
- **Composto de**: [moléculas + átomos + organismos]
- **Props (API)**: `[{ … }]` — recebe dados/handlers da ViewModel (view burra, Princ. XI)
- **Variações/estados**: [vazio · carregando · erro · paginado · com/sem filtros]
- **Padrões de composição**: [moléculas dissimilares (header) vs. repetidas (linhas de tabela)]
- **Tokens**: [...]
- **Acessibilidade**: [estrutura semântica, foco, navegação por teclado, aria-live em modais]
- **Usado em (linhagem)**: [templates/pages]
- **Evidência**: [ref]

---

[Repita. Ex.: DataTable (linha clicável + paginação), FilterPanel (toggle), FormCard (1/2/3 seções),
DualPanel (transfer +/−), ConfirmModal, DeactivateModal (com/sem campo Motivo), AppShell/Sidebar.]

## Cobertura vs. inventory

| Organismo do inventory | Coberto? | Documento |
|---|---|---|
| [...] | ✅/⬜ | [esta seção] |
