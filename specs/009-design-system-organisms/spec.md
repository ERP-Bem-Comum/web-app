# Feature Specification: Fundação de Organismos (Design System)

**Feature Branch**: `009-design-system-organisms`

**Created**: 2026-06-07

**Status**: Draft

**Escopo confirmado (2026-06-07)**: esta entrega cobre **somente as histórias P1** — **tabela de dados (US1)** e **cabeçalho de página (US2)**. As histórias US3–US5 (barra de controles, diálogo modal, layout de formulário) ficam **fora do escopo** desta feature, registradas para specs incrementais futuras. O módulo `contracts` **não** será migrado nesta feature.

**Input**: User description: "Fundação de organismos do design system em src/shared/ui/organisms/ seguindo Atomic Design (tokens ← atoms ← molecules ← organisms). Objetivo: estabelecer a camada de organismos compartilhados — hoje só existem atoms e molecules — para padronizar e destravar as ~12 telas de parceiros (e futuras telas), reduzindo a duplicação de componentes locais que hoje cada feature recria."

## Visão Geral

Hoje o design system (`src/shared/ui`) tem **tokens**, **atoms** (Button, Input, Checkbox, Logo, Card) e **molecules** (Field, Badge, InputWithIcon). A camada de **organismos** — blocos de UI compostos e reutilizáveis — ainda não existe (o `README.md` a marca como "virá em spec futura").

Como consequência, a primeira feature de tela rica (`contracts`) precisou criar **componentes locais** que são, na verdade, peças genéricas: tabela de dados, barra de filtros, paginação, dropdown de exportação, chips de status. As ~12 telas de parceiros (fornecedores, financiadores, geografia, ACTs — cada um com listar/criar/editar/detalhar) repetiriam essa mesma duplicação se nada mudar.

Esta feature estabelece a **fundação de organismos compartilhados**: um conjunto enxuto de blocos genéricos, agnósticos de domínio, que padronizam a aparência e o comportamento das telas de listagem/cadastro e **destravam** as telas de parceiros sem que cada feature reinvente o mesmo componente.

## User Scenarios & Testing *(mandatory)*

> Nesta feature, o "usuário primário" é o **desenvolvedor de telas** (consumidor do design system); o **usuário final** do ERP é beneficiário indireto, ganhando consistência visual e de comportamento entre telas.

### User Story 1 - Listagem padronizada (tabela de dados genérica) (Priority: P1)

Um desenvolvedor precisa montar uma tela de listagem (ex.: Fornecedores). Em vez de recriar uma tabela do zero, ele consome um organismo de **tabela de dados** que recebe colunas e linhas por props (vindas da ViewModel) e já trata, de forma consistente, os estados de **carregando**, **vazio** e **erro**, além do cabeçalho de colunas e da estrutura visual.

**Why this priority**: A listagem é o coração de toda tela de parceiro (4 entidades × tela de lista). É o organismo de maior alavancagem — sozinho já destrava as 4 telas de listagem e padroniza o que hoje é o `contracts-table` local.

**Independent Test**: Renderizar a tabela com um conjunto de colunas e dados fictícios e verificar que as linhas aparecem; alternar para estado vazio e verificar a mensagem de "nenhum resultado"; alternar para carregando e verificar o indicador. Tudo isolado, sem backend.

**Acceptance Scenarios**:

1. **Given** colunas e linhas fornecidas por props, **When** a tabela é renderizada, **Then** cada linha exibe os valores nas colunas corretas, na ordem definida.
2. **Given** uma lista vazia, **When** a tabela é renderizada, **Then** uma mensagem de estado vazio (texto via i18n) é exibida no lugar das linhas.
3. **Given** o estado "carregando", **When** a tabela é renderizada, **Then** um indicador de carregamento é exibido e nenhuma linha de dado real aparece.
4. **Given** o estado "erro", **When** a tabela é renderizada, **Then** uma mensagem de erro (via i18n) é exibida sem quebrar o layout.

---

### User Story 2 - Cabeçalho de página consistente (Priority: P1)

Toda tela tem um cabeçalho com **título**, opcional subtítulo/descrição e uma área de **ações** (ex.: botão "Novo fornecedor"). O desenvolvedor consome um organismo de **cabeçalho de página** que padroniza esse topo, em vez de cada tela montar seu próprio "hero".

**Why this priority**: Aparece em 100% das telas (lista, criar, editar, detalhar). Baixíssimo custo, altíssima recorrência — junto com a tabela forma o esqueleto visual de qualquer tela.

**Independent Test**: Renderizar o cabeçalho com um título e um botão de ação no slot de ações; verificar que título e ação aparecem; renderizar sem ações e verificar que o layout permanece íntegro.

**Acceptance Scenarios**:

1. **Given** um título e um slot de ações com um botão, **When** o cabeçalho é renderizado, **Then** o título e o botão aparecem alinhados conforme o design.
2. **Given** apenas um título (sem ações e sem subtítulo), **When** renderizado, **Then** o layout permanece consistente sem espaços quebrados.

---

> ⛔ **As histórias abaixo (US3–US5) estão FORA do escopo desta entrega.** Permanecem documentadas
> como roadmap para specs incrementais futuras, mas **não** geram tasks nesta feature.

### User Story 3 - Barra de controles de listagem (busca, filtros, exportar) (Priority: P2) — *fora desta entrega*

Acima da tabela, o desenvolvedor precisa de uma **barra de controles**: campo de busca, filtros (ex.: status ativo/inativo) e uma ação de **exportar**. Ele consome um organismo (ou conjunto coeso) que padroniza essa barra, em vez de recriar `contract-filters` + `export-dropdown` por feature.

**Why this priority**: Importante para a usabilidade das listagens, mas a tela de lista já é viável (P1) com tabela + cabeçalho; a barra de controles é o incremento que a torna completa.

**Independent Test**: Renderizar a barra com um valor de busca controlado e um conjunto de filtros; disparar a digitação na busca e verificar que o callback é chamado; acionar "exportar" e verificar o callback.

**Acceptance Scenarios**:

1. **Given** um valor de busca e callback por props, **When** o usuário digita, **Then** o callback de mudança de busca é chamado com o novo valor.
2. **Given** filtros disponíveis por props, **When** o usuário seleciona um filtro, **Then** o callback de mudança de filtro é chamado com a seleção.
3. **Given** uma ação de exportar habilitada, **When** o usuário a aciona, **Then** o callback de exportação é chamado.

---

### User Story 4 - Diálogo modal para confirmação/ações (Priority: P2) — *fora desta entrega*

Ações sensíveis (ex.: **inativar** um fornecedor, **alternar** um estado de geografia) precisam de confirmação. O desenvolvedor consome um organismo de **diálogo modal** acessível (foco preso, fechar por ESC/overlay, rótulos ARIA) que recebe conteúdo e ações por props.

**Why this priority**: Necessário para os fluxos de escrita das telas de parceiros (ativar/inativar, confirmar). Vem depois do esqueleto de leitura (P1).

**Independent Test**: Abrir o diálogo via prop de aberto/fechado, verificar que o conteúdo aparece e o foco vai para dentro; pressionar ESC e verificar o callback de fechar; acionar o botão de confirmar e verificar o callback.

**Acceptance Scenarios**:

1. **Given** o diálogo aberto, **When** renderizado, **Then** o conteúdo e as ações (confirmar/cancelar) aparecem e o foco é movido para dentro do diálogo.
2. **Given** o diálogo aberto, **When** o usuário pressiona ESC ou clica fora, **Then** o callback de fechar é chamado.
3. **Given** o diálogo fechado, **When** renderizado, **Then** nada do diálogo fica visível nem acessível por leitor de tela.

---

### User Story 5 - Layout de formulário para criar/editar (Priority: P3) — *fora desta entrega*

Telas de **criar/editar** precisam organizar campos em seções com título e em grade consistente. O desenvolvedor consome um organismo de **layout de formulário** (seções + grade de campos + rodapé de ações) que compõe os átomos `Field`/`Input` existentes, sem recriar o esqueleto de formulário por feature.

**Why this priority**: As telas de cadastro vêm depois das de leitura no fluxo de entrega; o layout de formulário é o incremento que padroniza criar/editar.

**Independent Test**: Renderizar o layout com duas seções, cada uma com campos filhos, e um rodapé com botões salvar/cancelar; verificar agrupamento visual e que as ações do rodapé disparam seus callbacks.

**Acceptance Scenarios**:

1. **Given** seções com campos e um rodapé de ações, **When** renderizado, **Then** os campos aparecem agrupados por seção e o rodapé exibe as ações.
2. **Given** o rodapé com salvar/cancelar, **When** o usuário aciona uma ação, **Then** o callback correspondente é chamado.

---

### Edge Cases

- **Tabela com muitas colunas / texto longo**: o organismo deve degradar de forma previsível (sem quebrar o layout da página) — overflow tratado de forma consistente.
- **Conteúdo de célula não-textual** (ex.: badge de status, botões de ação por linha): a tabela deve aceitar renderização customizada por coluna sem acoplar a domínio.
- **Diálogo aberto durante carregamento de uma ação** *(US4 — futuro)* (ex.: confirmando inativação enquanto a requisição corre): o organismo deve permitir um estado "ocupado/desabilitado" das ações sem fechar sozinho.
- **Barra de controles em viewport estreito** *(US3 — futuro)*: busca/filtros/export devem reorganizar-se sem sobreposição.
- **Estado vazio vs. estado de erro vs. carregando**: os três são distintos e mutuamente exclusivos na tabela; nunca exibir dois ao mesmo tempo.
- **Acessibilidade**: tabela com cabeçalhos associados, diálogo com `role`/foco corretos, controles com rótulos — todos navegáveis por teclado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O design system MUST passar a expor uma camada de **organismos** em `src/shared/ui/organisms/`, importável pela porta única `#shared/ui` (barrel), no mesmo padrão de atoms e molecules.
- **FR-002**: A fundação desta entrega MUST incluir exatamente os organismos das histórias **P1**: **tabela de dados (US1)** e **cabeçalho de página (US2)**. Barra de controles, diálogo modal e layout de formulário (US3–US5) estão **fora do escopo** desta feature.
- **FR-003**: Todo organismo MUST ser uma **view burra**: recebe dados e callbacks exclusivamente por props (fornecidos pela ViewModel/feature), sem buscar dados, sem estado de negócio e sem conhecer domínio específico (parceiros, contratos, etc.).
- **FR-004**: Os organismos MUST ser **agnósticos de domínio** — nenhuma string, tipo ou regra de fornecedor/contrato embutida. Customização de conteúdo (ex.: célula de tabela) MUST ser por composição/render-prop, não por acoplamento.
- **FR-005**: Os organismos MUST respeitar a hierarquia do Atomic Design: dependem apenas de **tokens, atoms e molecules** — nunca de `modules/`, `server/`, `data/` ou de outra feature. Esta fronteira MUST ser verificável por lint.
- **FR-006**: Toda string visível MUST vir do sistema de i18n (tags), nunca literal embutida no organismo. Textos de estado (vazio/erro/carregando) e rótulos padrão MUST ser fornecidos por props i18n pela feature consumidora ou referenciar tags do design system.
- **FR-007**: Os organismos MUST seguir a regra "**só tokens**": nenhuma cor (hex/rgb/hsl) ou medida (px) crua — apenas `vars.*`. Esta regra MUST ser verificável por lint.
- **FR-008**: Cada organismo MUST seguir a anatomia de arquivos do design system (`<nome>.component.tsx`, `<nome>.css.ts`, `index.ts`, e `.variants.ts`/`.controller.ts` apenas quando houver lógica pura/estado), com tipos de props públicos re-exportados pelo barrel.
- **FR-009**: A tabela de dados MUST suportar os estados mutuamente exclusivos **carregando**, **vazio**, **erro** e **com dados**, e MUST aceitar definição de colunas com renderização customizada por célula.
- **FR-010**: *(fora de escopo desta entrega — diálogo modal acessível; pertence à US4. Ver "Fora de Escopo".)*
- **FR-011**: Os organismos MUST ter **baselines de teste visual** (regressão de UI) cobrindo seus estados principais, conforme o processo de testes visuais do projeto.
- **FR-012**: A documentação do design system (`shared/ui/README.md`) MUST ser atualizada para listar os organismos da fundação e como consumi-los, removendo a marcação de "virá em spec futura".
- **FR-013**: O `contracts` (feature de referência) **NÃO** será migrado nesta feature (decisão de escopo, 2026-06-07). Permanece com seus componentes locais; a equivalência entre eles e os organismos da fundação MUST ser documentada para migração futura.

### Fora de Escopo (esta feature)

Registrado explicitamente para evitar ambiguidade — itens desejáveis que ficam para specs incrementais:

- **Barra de controles de listagem** (busca/filtros/export) — US3.
- **Diálogo modal** acessível — US4 (requisito **FR-010**, detalhado para a spec futura).
- **Layout de formulário** (seções/grade/rodapé) — US5.
- **Migração do `contracts`** para consumir os organismos — FR-013.
- **Telas de parceiros** em si (consumidoras da fundação) — feature(s) seguinte(s).
- **Paginação** como organismo isolado — quando vier a barra de controles/uma tela exigir.

### Key Entities *(conceituais — esta feature não tem dados de domínio)*

- **Organismo**: bloco de UI composto e reutilizável, agnóstico de domínio, que compõe atoms/molecules. Atributos: nome, contrato de props, estados visuais suportados, baseline visual.
- **Definição de coluna (tabela)**: descreve uma coluna — rótulo (i18n), como extrair/renderizar o valor de cada linha, alinhamento. Sem conhecer o tipo de dado de domínio.
- **Ação de cabeçalho/diálogo**: rótulo (i18n) + callback + estado (habilitada/ocupada). Sem lógica de negócio.

## Impacto Arquitetural (web-app) *(esta feature toca `src/`)*

> Feature **puramente frontend** (web-app). **Não toca o core-api** — sem novos agregados, eventos, CLI ou borda HTTP no backend. A seção abaixo adapta o template ao contexto do design system.

- **Bounded Contexts (core-api) afetados**: **N/A** — nenhuma alteração no backend.
- **Camada do web-app afetada**: `src/shared/ui` (design system, tipo `shared-ui` no `eslint-plugin-boundaries`). Nova subcamada `organisms/`.
- **Fronteiras de import (lint)**: organismos entram na cadeia `tokens ← atoms ← molecules ← organisms` (só "para baixo"). Pode ser necessário ajustar `eslint.config.js` / `boundaryRules` para reconhecer a nova subcamada e manter a hierarquia enforçada.
- **Constituição / ADRs envolvidos**: princípios de UI (views burras §XI), ADR-0007 (design system / vanilla-extract), regra "só tokens". Sem exceções previstas — se algum organismo exigir `class`/estado complexo, escalar no "Complexity Tracking" do plano.
- **Possíveis violações da constituição**: nenhuma prevista. Atenção a não vazar domínio para `shared/ui` (FR-004) e a não introduzir `Error`/`throw`/`class` (exceto o permitido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O esqueleto de uma tela de listagem (cabeçalho de página + tabela com seus estados) pode ser composto **consumindo apenas os organismos de `#shared/ui`** mais a ViewModel — **sem criar nenhum componente de tabela ou cabeçalho local** na feature.
- **SC-002**: Os organismos da fundação são **agnósticos de domínio**: zero referências a parceiros/contratos no código de `organisms/` (verificável por inspeção/lint), permitindo reuso por qualquer feature.
- **SC-003**: As fronteiras de import e a regra "só tokens" passam no lint (`pnpm lint`) sem exceções para os novos organismos; tentativa de importar `modules/`/`data/` de dentro de um organismo **falha** no lint.
- **SC-004**: Cada organismo da fundação tem baseline de teste visual cobrindo seus estados principais, e `pnpm test:visual` passa contra esses baselines.
- **SC-005**: O esforço para montar uma nova tela de listagem cai de "recriar N componentes locais" (hoje o `contracts` tem ~6 componentes de listagem locais) para "compor organismos prontos + ViewModel", reduzindo a duplicação entre as 4 telas de listagem de parceiros.
- **SC-006**: A documentação (`shared/ui/README.md`) lista os organismos e seu uso; um desenvolvedor consegue identificar qual organismo usar e como, sem ler o código-fonte.

## Assumptions

- **Escopo enxuto confirmado (2026-06-07)**: a fundação entrega **apenas os 2 organismos P1** — **tabela de dados (US1)** e **cabeçalho de página (US2)**. É o mínimo que prova a camada de organismos e destrava o esqueleto de **leitura** das telas de parceiros. Barra de controles, modal e layout de formulário viram specs incrementais.
- **Extração guiada pelo `contracts`**: os componentes locais do `contracts` (`contracts-table`, `contract-filters`, `contract-paginator`, `export-dropdown`, `contract-status-chips`) são a **referência de extração** — o que for genérico vira organismo; o que for específico de contrato permanece local.
- **Migração do `contracts` é opcional nesta feature** (FR-013): a prova de valor primária é **destravar parceiros**; refatorar o `contracts` para consumir os organismos pode ser um passo seguinte para evitar inchar o escopo e o risco de regressão visual numa feature já estável.
- **Telas de parceiros não fazem parte desta feature**: aqui entregamos a *fundação* (os organismos). As ~12 telas de parceiros são consumidoras e serão construídas em feature(s) seguinte(s).
- **Stack fixa do projeto**: vanilla-extract (`.css.ts`), React 19, sem `class`/`this`/`throw` (exceto bordas permitidas), imutabilidade, i18n para strings. Os organismos seguem a anatomia de arquivos já documentada em `shared/ui/README.md`.
- **Paginação**: tratada como parte do organismo de tabela ou como peça da barra de controles (decisão de design no `/speckit-plan`), não como organismo isolado nesta fundação.
- **Sem dependências externas novas** preferencialmente: usar APIs nativas (ex.: `<dialog>`/foco nativo, `EventTarget`) antes de adicionar libs; qualquer nova dependência segue a política de supply-chain do projeto.
