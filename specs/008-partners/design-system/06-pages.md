# 06 · Pages: Gestão de Parceiros

**Feature**: `specs/008-partners/design-system/` · **Nível**: Pages (Atomic Design, Cap. 2)

> Instâncias concretas dos templates com conteúdo real + variações/edge-cases. Validam a resiliência dos
> padrões. Cada página mapeia uma rota e seu fluxo (page → binding → view-model → data).

### Colaboradores — Listagem · `/colaboradores`
- **Template**: `ListTemplate` (com `FilterPanel` de 11 campos)
- **Conteúdo real**: ~41 registros (ambiente teste); colunas REP. LEGAL · EMAIL · ÁREA · CONTRATOS/ADITIVOS(vazia) · FUNÇÃO · STATUS
- **Variações**: cheia/paginada · vazia (empty) · erro · carregando · encoding saneado (Avaliação)

### Colaborador — Adicionar (pré-cadastro) · `/colaboradores/adicionar`
- **Template**: `CreateTemplate` (7 campos) → cria com situação `Pré Cadastrado`

### Colaborador — Detalhe/Editar · `/colaboradores/detalhes/:id` · `/editar/:id`
- **Template**: `DetailTemplate` (2 seções) · editar habilita campos + Desativar (Motivo) + Salvar/Cancelar
- **Edge-cases**: campos completos ausentes (pré-cadastrado); Motivo obrigatório; descartar alterações

### Fornecedores — Listagem/Detalhe/Adicionar · `/fornecedores[...]`
- **Template**: `ListTemplate` (filtros status/categoria + Exportar) · `DetailTemplate`/`CreateTemplate` (3 seções: cadastrais+bancários+PIX)
- **Edge-cases**: linha clicável; banco vazio mas bancário visível; export via mock; breadcrumb padronizado

### Financiadores — `/financiadores[...]`
- **Template**: `ListTemplate` (sem FilterPanel) · `DetailTemplate` (1 seção, 6 campos)
- **Edge-cases**: modal desativar com texto dinâmico + hierarquia de botões invertida; paginação 1-1

### Estados parceiros · `/estados`
- **Template**: `DualPanelTemplate` (27 UFs) — add/remove imediato; "Adicionado" cinza; dado: Acre adicionado
- **Edge-cases**: busca por painel; sem modal; persistência **real** (toggle idempotente por UF)

### Municípios parceiros · `/municipios`
- **Template**: `DualPanelTemplate` + UF obrigatória — "Nenhum resultado" sem UF; cross-state no painel direito; dado: Anamã-AM
- **Edge-cases**: trocar UF mantém selecionados; "Adicionado" mesmo vindo de outra UF

## Cobertura de telas

| Tela (evidência) | Documentada? | Rota | Template |
|---|---|---|---|
| Colaboradores (4 telas) | ✅ | `/colaboradores[...]` | List/Detail/Create |
| Fornecedores (4) | ✅ | `/fornecedores[...]` | List/Detail/Create |
| Financiadores (4) | ✅ | `/financiadores[...]` | List/Detail/Create |
| Estados | ✅ | `/estados` | DualPanel |
| Municípios | ✅ | `/municipios` | DualPanel |
