# 05 · Templates: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Nível**: Templates (Atomic Design, Cap. 2)

> **Templates** = objetos no nível de página que posicionam organismos num **layout** e articulam a
> **estrutura de conteúdo** — o esqueleto, sem conteúdo final. Definem guardrails do conteúdo dinâmico
> (dimensões, limites de caracteres, nº de colunas). No web-app, um template ≈ o `*.page.tsx` "burro"
> que LIGA a ViewModel + compõe organismos. **Foco em estrutura, não em dados reais** (isso é o doc 06).

## Lista de templates de layout

### [`TemplateName`] — [tipo de tela]
- **Layout**: [grid/regiões — ex.: header + área de filtros + tabela + paginação]
- **Organismos posicionados**: [DataTable, FilterPanel, …]
- **Estrutura de conteúdo (guardrails)**: [nº colunas, larguras, limites de texto, imagem]
- **Regiões dinâmicas / slots**: [o que varia por instância]
- **Mapeia para**: [`<m>/client/<comportamento>/*.page.tsx`]
- **Rota(s)**: [`/...`]

---

[Repita. Ex.: ListTemplate (listagem+busca+filtros+paginação), DetailTemplate (FormCard read/edit),
CreateTemplate (FormCard adicionar), DualPanelTemplate (transfer + filtro UF).]

## Matriz template × comportamento

| Template | Comportamentos que usam | Variações de layout |
|---|---|---|
| [ListTemplate] | [colaboradores, fornecedores, financiadores] | [com/sem painel de filtros] |
