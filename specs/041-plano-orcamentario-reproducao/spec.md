# Feature Specification: Módulo Plano Orçamentário (Planejamento + Consolidado ABC)

**Feature Branch**: `041-plano-orcamentario-reproducao`

**Created**: 2026-07-01

**Status**: Draft

**Input**: Reproduzir no web-app v2 o módulo **Plano Orçamentário** do sistema legado, com fidelidade.
Fonte de verdade do escopo: `HANDBOOK-plano-orcamentario-mapa.md` (mapa das telas + **Apêndice B** com
entities/enums/4 fórmulas/contratos do legado `../ERP-BACKEND`). Decisões da P.O. travadas (ver
`RESPOSTA-techlead-plano-orcamentario-113.md`): MVP amplo começando por Planejamento; cálculos e CSV no
backend, com **preview** de cálculo no front; compartilhamento externo **adiado**; não bloqueia go-live.

> **Zero-mock (ADR-0011):** cada tela só fecha quando o endpoint real do core-api existe. Esta feature é
> **fatiada por PR**; o front **adianta** o que independe do backend (model Zod, validações, funções puras
> de preview de cálculo em centavos), mas nenhuma tela vai a produção sem a server function correspondente.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Listar, filtrar e criar planos orçamentários (Priority: P1)

Como usuário de planejamento, acesso **Plano Orçamentário → Planejamento** (`/planejamento`), vejo a lista de
planos (`Ano Programa Versão`, Total, Parceiros, Status) com versões-filhas expansíveis, filtro (funil:
Ano/Programa/Status) e busca; e crio um novo plano (Ano + Programa, opção "Importar dados" de um ano anterior).

**Why this priority**: é a porta de entrada do módulo — sem listar/criar plano, nada mais existe. Menor fatia que já dá valor.

**Independent Test**: via `/planejamento` consigo ver a lista paginada, filtrar por status, e abrir o modal "Criar Plano".

**Acceptance Scenarios**:

1. **Given** planos cadastrados, **When** abro `/planejamento`, **Then** vejo a tabela com colunas Plano/Total/Parceiros/Status, badges (Rascunho/Em Calibração/Aprovado) e trilha "{usuário} alteração {data}".
2. **Given** a lista, **When** expando o chevron de um plano-pai, **Then** vejo as versões-filhas com seus rótulos (Inicial / nome do cenário).
3. **Given** o funil aberto, **When** filtro por Ano+Programa+Status e clico "Filtrar", **Then** a lista reflete o filtro.
4. **Given** "Criar Plano", **When** informo Ano+Programa e confirmo, **Then** o plano v1.0 é criado; se Ano+Programa já existe, vejo _"Já existe um plano orçamentário com essas informações."_.
5. **Given** "Importar dados" ligado, **When** escolho "Criar a partir do ano de" X, **Then** o plano é semeado com os dados do ano X (ou aviso "não existem dados").

---

### User Story 2 - Estruturar centros de custo e editar o orçamento por rede com preview (Priority: P2)

No **Detalhe do plano** (`/planejamento/detalhes/:id`) gerencio a árvore **Centro de Custo → Categoria →
Subcategoria** (cada subcategoria com `Tipo` Institucional/Rede e `Tipo de lançamento`), adiciono orçamento por
**Rede** (Estado; + Município se municipal), e na tela de **Edição de Orçamento** (`.../orcamento/:oid`) lanço os
valores no modal **"Calculando Gastos"** — com os **4 tipos** (Pessoal/IPCA/CAED/Logística) e **preview do valor** em tempo real.

**Why this priority**: é o coração do módulo (onde o orçamento é efetivamente montado). Depende de P1.

**Independent Test**: com um plano em Rascunho, filtro por rede, clico Editar, abro "Calculando Gastos", preencho um lançamento e vejo o preview + salvo.

**Acceptance Scenarios**:

1. **Given** o detalhe, **When** abro "Centro de Custo", **Then** gerencio a árvore (adicionar/editar/desativar centro, categoria, sub categoria com Tipo + Tipo de lançamento).
2. **Given** o detalhe, **When** seleciono a Rede (Estado [+ Município]) e clico "Filtrar", **Then** o botão **"Editar"** é habilitado.
3. **Given** a tela de Orçamento, **When** clico no ícone de calculadora de uma subcategoria, **Then** abre "Calculando Gastos" com o form correspondente ao `Tipo de lançamento`.
4. **Given** um lançamento (ex.: folha), **When** preencho os campos, **Then** vejo o **Custo Total (mensal/anual)** recalculado ao vivo (preview), idêntico ao que o backend gravaria.
5. **Given** um plano **Aprovado**, **When** abro a edição, **Then** os valores ficam **somente leitura**; em Rascunho/Em Calibração a edição é permitida.
6. **Given** "Utilizar ano anterior" (IPCA), **When** ligo o toggle, **Then** a base vem do ano anterior aprovado (ou aviso de ausência) e aplico aos meses marcados.

---

### User Story 3 - Versionar (cenário, calibração), aprovar, excluir e ver insights (Priority: P3)

Gerencio o ciclo de vida do plano: **Criar cenário** (nome livre), **Iniciar Calibração** (de um Aprovado),
**Aprovar** (com confirmação e recálculo), **Excluir** (cascata, com confirmação), e consultar **Insights**
(histórico 5 anos, planejado × realizado, média por rede).

**Why this priority**: completa o MVP amplo, mas depende de P1/P2 já existirem.

**Independent Test**: a partir de um plano Aprovado, inicio calibração → surge versão Em Calibração editável; aprovo → volta a Aprovado.

**Acceptance Scenarios**:

1. **Given** um plano, **When** "Criar cenário desse plano" e informo o nome, **Then** surge versão-filha Rascunho rotulada com o nome.
2. **Given** um plano Aprovado, **When** "Iniciar Calibração", **Then** surge versão X.0 **Em Calibração** (editável).
3. **Given** um plano editável, **When** "Aprovar Plano" e confirmo, **Then** vejo "Calculando…" (recálculo) e depois "Plano Orçamentário aprovado com sucesso!"; status → Aprovado.
4. **Given** um plano Rascunho/Em Calibração, **When** "Excluir Plano" e confirmo, **Then** o plano e filhos são removidos ("Plano excluído com sucesso!").
5. **Given** ação sem permissão, **When** aciono, **Then** vejo "Você não possui permissão para executar esta ação.".

---

### User Story 4 - Consolidado ABC e exportações (Priority: P3)

Em **Consolidado ABC** (`/consolidado`) vejo a consolidação dos planos **Aprovados** por Ano Base × Programa(s)
(matriz Centro de Custo × meses), com **Exportar Excel/CSV** (gerado pelo backend). Nas telas de plano/orçamento
uso **Exportar CSV**.

**Why this priority**: relatório final; depende de existirem planos aprovados (P1–P3).

**Acceptance Scenarios**:

1. **Given** `/consolidado`, **When** filtro Ano Base + Programa(s) e "Filtrar", **Then** vejo a matriz consolidada e o total; sem dados → "Nenhum resultado encontrado".
2. **Given** o consolidado, **When** "Exportar Excel", **Then** o backend gera o arquivo no layout definido (amostra `…-export-exemplo.csv`).

---

### Edge Cases

- Lista vazia (0 planos) e filtro sem resultados → estados vazios claros.
- Erro do BFF (`AppError.kind`) → tag i18n; sem vazar status HTTP (Princ. V).
- Duplo submit em criar/aprovar/excluir → idempotência de UI (desabilitar + estado de carregamento).
- Estado assíncrono pós-aprovar ("Calculando…" por linha) até o recálculo terminar.
- Rede: exigir **exatamente um** parceiro por orçamento (Estado XOR Município); bloquear parceiro duplicado.
- Edição bloqueada em Aprovado; para editar, iniciar Calibração.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE listar planos-raiz paginados com versões-filhas expansíveis, filtro (Ano/Programa/Status) e busca textual.
- **FR-002**: O sistema DEVE criar um plano (Ano+Programa, v1.0), validando unicidade (Ano+Programa) e oferecendo "Importar dados" de um ano anterior aprovado.
- **FR-003**: O sistema DEVE gerenciar a árvore Centro de Custo → Categoria → Subcategoria (CRUD + ativar/desativar), com `Tipo` (Institucional/Rede) e `Tipo de lançamento` na subcategoria.
- **FR-004**: O sistema DEVE permitir adicionar orçamento por Rede (Estado; + Município para programas municipais), impedindo parceiro duplicado e exigindo exatamente um parceiro.
- **FR-005**: O sistema DEVE editar valores por subcategoria/mês via "Calculando Gastos", com os 4 tipos de lançamento (Pessoal, IPCA, CAED, Logística), e **preview do cálculo em centavos** espelhando o backend.
- **FR-006**: O sistema DEVE respeitar a regra de edição por status: **Rascunho** e **Em Calibração** editáveis; **Aprovado** somente leitura.
- **FR-007**: O sistema DEVE oferecer Criar Cenário (nome livre), Iniciar Calibração (de Aprovado → Em Calibração), Aprovar (com confirmação + recálculo), Excluir (cascata, com confirmação).
- **FR-008**: O sistema DEVE exibir Insights (média 5 anos, planejado × realizado, média por rede). O **Realizado** vem do Financeiro/Conciliação (status `CONCILIADO`).
- **FR-009**: O sistema DEVE apresentar o Consolidado ABC (Ano Base × Programa[s], matriz Centro de Custo × meses) e disparar exportações (CSV/Excel) **geradas pelo backend**.
- **FR-010**: O sistema DEVE validar todas as entradas na borda (Zod no input da server fn) e nunca expor token no browser.
- **FR-011**: "Planejado x Realizado" DEVE existir como item/tela **placeholder** (função a definir).
- **FR-012** [NEEDS CLARIFICATION]: uso do campo "Qtd de {subcategoria}" na folha — a fórmula legada não multiplica por quantidade (metadado); confirmar comportamento da UI.

### Key Entities

- **PlanoOrcamentario**: Ano, Programa, Versão, Rótulo (Inicial/nome do cenário), Status (Rascunho/Em Calibração/Aprovado), Total (centavos), plano-pai (árvore), auditoria (usuário/data).
- **Orcamento (por Rede)**: pertence a um plano; um parceiro = Estado **ou** Município; Total (centavos).
- **CentroDeCusto → Categoria → Subcategoria**: por plano; centro tem tipo A_PAGAR/A_RECEBER; subcategoria tem `tipo` (Institucional/Rede) e `tipoLancamento` (Pessoal/IPCA/CAED/Logística).
- **Lancamento (BudgetResult)**: célula (orçamento × subcategoria × mês); valor calculado (centavos) + inputs brutos (por tipo).
- **ConsolidadoABC**: agregação de planos Aprovados por Ano Base × Programa(s).

## Success Criteria _(mandatory)_

- **SC-001**: Usuário cria um plano e lança um orçamento completo de uma rede em < 10 min, sem erros de cálculo (preview == backend).
- **SC-002**: A lista de planos renderiza < 1s p95 com 200 planos/versões.
- **SC-003**: O preview de cálculo dos 4 tipos bate **exatamente** (centavos) com o valor gravado pelo backend em 100% dos casos de teste.
- **SC-004**: A matriz do Consolidado ABC e o CSV exportado batem com a amostra de referência.

## Impacto Arquitetural (web-app / BFF) _(obrigatório)_

- **Módulo(s) vertical(is) afetado(s)**: **novo** `src/modules/budget-plans/` (espelha a feature-modelo `auth`; split client MVVM × server BFF/DDD). Consome `programs` (Programa) e integra com `financial` (Realizado = CONCILIADO) via `public-api`.
- **Server functions novas (Princ. I/III)**: listar/criar/obter plano; árvore de centros; adicionar/excluir orçamento; upsert de lançamento por tipo; aprovar/cenário/calibração/excluir; consolidado; insights; disparo de CSV. Todas com input Zod.
- **Integração core-api**: **módulo inexistente hoje** (só `budgetPlanRef`). Requer novos endpoints — rastrear prontidão em `api-readiness-report.md` (gate de cada fatia).
- **Novos agregados / VOs (server/domain, Princ. IV)**: branded types para `Cents`, `Month(1-12)`, enums (`BudgetPlanStatus`, `ReleaseType`, `SubCategoryType`, `CostCenterType`); smart constructors com `Result<T,E>`.
- **Eventos no client (Princ. XII)**: `BudgetPlanApproved`, `BudgetSaved` (passado, EN) para invalidar server-state.
- **Design System**: reutilizar átomos/moléculas existentes (tabela em árvore, modais, tabs, toggles); avaliar organismos novos (grid matriz mês, painel "Calculando Gastos" 3 colunas). Só tokens (Princ. X).
- **Possíveis violações**: nenhuma prevista; atenção a **não** colocar regra de cálculo "de verdade" só no client (preview é auxiliar; fonte é o backend), e a manter views burras (cálculo em função pura/ViewModel, não na view).

## Assumptions

- O core-api implementará o módulo espelhando os contratos do legado (Apêndice B) — enums e fórmulas já conhecidos.
- `programs` (Programa) e o financeiro (`CONCILIADO`) já existem no core-api.
- Cálculos e CSV são autoridade do backend; o front faz **preview** e exibição.
- Valores trafegam/são exibidos em **centavos** (bigint) para evitar divergência de arredondamento.

## Out of Scope

- **Compartilhamento externo** (link + senha / credencial): adiado para pós-entrega (decisão #9).
- **"Planejado x Realizado"** funcional: entra como placeholder; lógica a definir.
- Reescrita do mecanismo de auth externa do legado (credencial fraca) — quando #9 voltar.
- Seed inicial de centros de custo por programa (responsabilidade do backend).
