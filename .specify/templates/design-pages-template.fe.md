# 06 · Pages: [FEATURE]

**Feature**: `specs/[###-feature-name]/design-system/` · **Nível**: Pages (Atomic Design, Cap. 2)

> **Páginas** = instâncias concretas de templates com **conteúdo real e representativo**. Validam se os
> padrões aguentam o conteúdo de verdade e documentam **variações e edge-cases** (lista vazia vs cheia,
> texto curto vs longo, papéis de usuário, seções suprimidas). É aqui que se testa a resiliência do
> sistema. Cada página mapeia para uma rota real e seu fluxo (page → binding → view-model → data).

## Páginas (instâncias) por comportamento

### [Nome da página] — `[/rota]`
- **Template base**: [`ListTemplate`/`DetailTemplate`/…]
- **Conteúdo representativo**: [dados reais/realistas da evidência]
- **Variações documentadas**:
  | Variação | Estado | Comportamento esperado |
  |---|---|---|
  | [lista cheia] | [N itens, paginado] | [...] |
  | [lista vazia] | [0 itens] | [empty state] |
  | [erro] | [BFF AppError] | [tag i18n + retry] |
  | [carregando] | [pending] | [skeleton/spinner] |
- **Edge-cases**: [texto longo, status duplo, campo opcional ausente, permissão]
- **Fluxo de dados**: [page (burra) → `*.binding` → `*.view-model` → `*.repository` → server fn]

---

[Repita por tela real. Ex.: Colaboradores Listagem, Colaborador Detalhe, Colaborador Editar,
Colaborador Adicionar (pré-cadastro), Fornecedor Detalhe (3 seções), Estados (dual-panel), etc.]

## Cobertura de telas

| Tela (evidência) | Página documentada? | Rota | Template |
|---|---|---|---|
| [...] | ✅/⬜ | [/...] | [...] |
