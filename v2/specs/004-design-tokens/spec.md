# Feature Specification: Design Tokens Fundacionais (Design System v2)

**Feature Branch**: `feat/v2-auth` (corrente; spec dir `specs/004-design-tokens`)

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Design tokens fundacionais do design system da v2 em src/shared/ui/ usando vanilla-extract. Estabelecer os tokens base (cores, tipografia, espaçamento, radius, sombras) como a fonte única de verdade visual, com fidelidade à identidade da v1 para que o usuário quase não perceba diferença na migração. Escopo: SOMENTE os tokens fundacionais (não os componentes ainda)."

## Visão Geral

Esta feature estabelece a **camada de tokens** do design system compartilhado da v2 — a fonte única de verdade para cores, tipografia, espaçamento, raios e sombras. É a fundação sobre a qual átomos, moléculas e organismos das features serão construídos. **Não inclui componentes**: entrega apenas os tokens e o contrato de tema, prontos para consumo.

O critério-mor é **fidelidade visual à v1**: os valores derivam da identidade atual (ciano `#32C6F4`, fontes Inter/Nunito, radius `0.5rem`) para que, na migração, o usuário final **quase não perceba diferença**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desenvolvedor consome tokens para estilizar (Priority: P1)

Um desenvolvedor (frontend) construindo um componente em uma feature precisa aplicar a cor de marca, uma fonte e um raio de borda **sem escrever valores literais** (hex, px). Ele importa os tokens do design system compartilhado e referencia `cores.marca`, `fonte.corpo`, `raio.md` etc., com autocomplete e verificação de tipo.

> **Nota (nomes de token):** os nomes em PT-BR acima são **ilustrativos do conceito** de referência semântica. Os nomes **reais são em EN** (constituição: código em EN) — ex.: `color.brand.normal`, `font.family.body`, `radius.lg`. A árvore canônica está em [`data-model.md`](./data-model.md).

**Why this priority**: É o propósito central da feature. Sem isso, cada componente reinventaria valores, quebrando consistência e fidelidade visual — o oposto do objetivo de migração imperceptível.

**Independent Test**: Criar um arquivo de estilo de teste que referencia os tokens; verificar que (a) os valores resolvem para a identidade da v1, (b) o autocomplete/tipo funciona, (c) o CSS gerado contém os valores corretos.

**Acceptance Scenarios**:

1. **Given** o design system instalado, **When** o desenvolvedor referencia o token da cor de marca, **Then** o valor resolvido é `#32C6F4` (e o estado hover `#76D9F8`).
2. **Given** o design system instalado, **When** o desenvolvedor referencia um token inexistente (ex.: cor que não está no contrato), **Then** ocorre erro de compilação (não passa no build/lint).
3. **Given** um estilo que usa tokens, **When** o projeto é compilado, **Then** o CSS estático gerado contém os valores corretos (zero-runtime).

---

### User Story 2 - Designer/Tech Lead audita a paleta (Priority: P2)

O Tech Lead precisa verificar, num único lugar legível, **todos** os tokens disponíveis e seus valores, para garantir aderência à identidade da marca e ausência da paleta "institucional" duplicada da v1.

**Why this priority**: Governança visual. Garante que a fonte de verdade é única e auditável, evitando o problema da v1 (duas paletas concorrentes).

**Independent Test**: Abrir o arquivo de tokens e confirmar que a paleta é única, nomeada semanticamente, e não contém os valores institucionais (azul `#396496`, verde `#1f7d55`).

**Acceptance Scenarios**:

1. **Given** o arquivo de tokens, **When** auditado, **Then** existe exatamente uma paleta de marca (ciano) e nenhuma duplicação institucional.
2. **Given** os nomes dos tokens, **When** lidos, **Then** são semânticos (ex.: "superfície", "texto", "marca") e não presos a um contexto específico.

---

### User Story 3 - Suporte futuro a tema (ex.: dark) sem reescrever componentes (Priority: P3)

O time quer poder, no futuro, introduzir variações de tema (ex.: modo escuro) **trocando valores de tokens**, sem tocar nos componentes que os consomem.

**Why this priority**: Preparar o terreno. Não entrega o dark mode agora, mas o contrato de tema deve permitir múltiplas implementações sem refatorar consumidores.

**Independent Test**: Confirmar que os tokens são definidos via um **contrato** (nomes estáveis) separado de seus **valores**, de forma que um segundo conjunto de valores possa ser plugado depois.

**Acceptance Scenarios**:

1. **Given** o contrato de tokens, **When** um novo conjunto de valores é criado, **Then** ele satisfaz o mesmo contrato sem alterar quem consome os tokens.

---

### Edge Cases

- **Fontes ausentes/lentas**: quando Inter/Nunito não carregam, o texto deve cair para fontes de sistema (fallback) sem quebrar layout.
- **Valor de token referenciado mas não definido**: deve falhar em build/lint, nunca silenciosamente render "vazio".
- **Contraste**: a combinação marca + texto (ciano `#32C6F4` com texto preto) deve manter legibilidade (alvo WCAG AA para texto sobre o botão). *Verificação plena ocorre na feature de **componentes** (botão), não nesta camada de tokens — os tokens apenas disponibilizam o par de cores.*
- **Uso de hex/px literal por engano** num componente futuro: deve ser detectável (guard-rail de lint — fora do escopo desta entrega, mas o desenho dos tokens deve viabilizá-lo).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor um conjunto de **tokens de cor** cobrindo: marca (normal/hover), texto sobre marca, superfície (card branco), texto (escala de neutros), borda, e estados de feedback mínimos (erro). Os valores MUST refletir a identidade da v1 (marca `#32C6F4`, hover `#76D9F8`, texto sobre marca preto, superfície branca).
- **FR-002**: O sistema MUST expor **tokens de tipografia**: famílias para títulos (Inter), corpo (Nunito) e monoespaçada (JetBrains Mono), cada uma com cadeia de fallback de sistema; e uma escala de tamanhos/pesos suficiente para a tela de login (título, rótulo, corpo, auxiliar).
- **FR-003**: O sistema MUST expor **tokens de espaçamento** numa escala consistente (ex.: múltiplos previsíveis) suficiente para padding/gaps de formulário e card.
- **FR-004**: O sistema MUST expor **tokens de raio de borda** incluindo o raio base `0.5rem` (e derivados menor/maior), fiéis à v1.
- **FR-005**: O sistema MUST expor **tokens de sombra** (ex.: elevação de card) coerentes com o visual da v1.
- **FR-006**: Os tokens MUST ser **referenciáveis com verificação de tipo** — referenciar um token inexistente MUST falhar em tempo de build (não silenciosamente).
- **FR-007**: Os tokens MUST gerar **CSS estático no build** (sem custo de runtime de estilização).
- **FR-008**: O conjunto de tokens MUST residir no **design system compartilhado** (`src/shared/ui/`), acessível por qualquer feature conforme a matriz de boundaries (tipo `shared-ui`), e MUST NOT importar de camadas de feature.
- **FR-009**: Os tokens MUST ser **nomeados semanticamente** (papel, não valor cru) e MUST constituir **uma única paleta de marca**; o sistema MUST NOT incluir a paleta "institucional" duplicada da v1 (azul `#396496`/verde `#1f7d55`).
- **FR-010**: A definição MUST separar **contrato** (nomes/estrutura dos tokens) de **valores**, viabilizando temas alternativos futuros sem alterar consumidores.
- **FR-011**: As famílias de fonte MUST ter **fallbacks de sistema** que preservem o layout caso as webfonts não carreguem.
- **FR-012**: O escopo desta feature MUST ser **somente os tokens** — nenhum componente (átomo/molécula/organismo) é entregue aqui.

### Key Entities *(include if feature involves data)*

- **Token de cor**: representa um papel visual (marca, superfície, texto, borda, erro) → um valor de cor. Atributos: nome semântico, valor, estado (ex.: normal/hover).
- **Token de tipografia**: família de fonte (com fallback), tamanho, peso, associados a um papel (título/corpo/rótulo/mono).
- **Token de espaçamento**: passo nomeado de uma escala (ex.: xs…xl) → medida.
- **Token de raio**: nível nomeado (sm/md/lg) → medida; base `0.5rem`.
- **Token de sombra**: nível de elevação nomeado → definição de sombra.
- **Contrato de tema**: a estrutura/nomes de todos os tokens, independente de valores, que um conjunto de valores satisfaz.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos tokens visuais necessários para reconstruir a tela de login da v1 (cores, fontes, espaçamentos, raio, sombra do card) estão disponíveis na camada de tokens.
- **SC-002**: Zero valores de cor/raio/fonte "crus" (hex/px/nome de fonte literal) precisam ser escritos por um componente futuro de login — todos vêm de tokens.
- **SC-003**: Referenciar um token inexistente falha o build (verificável: tentativa de uso inválido não compila).
- **SC-004**: O CSS de tokens é gerado **estaticamente** no build (verificável: aparece no output de build, sem runtime de estilização).
- **SC-005**: Auditoria da paleta confirma **uma** paleta de marca e **nenhuma** ocorrência dos valores institucionais duplicados da v1.
- **SC-006**: Comparação visual lado a lado (v1 vs. valores de token) da cor de marca, raio e fontes não apresenta diferença perceptível.

## Assumptions

- **Fidelidade = paleta legada (ciano)**: a identidade real da tela de login da v1 usa a paleta legada (`#32C6F4`/`#76D9F8`), não a "institucional". Esta é a referência de fidelidade. (Confirmado pela investigação da v1.)
- **Fontes**: Inter (títulos) e Nunito (corpo) — mesmas famílias da v1; JetBrains Mono incluída para paridade, ainda que o login não use mono. A estratégia de carregamento das webfonts (CDN vs. self-host) é detalhe de implementação a ser decidido no `/speckit-plan`.
- **Radius base**: `0.5rem`, idêntico à v1.
- **Escopo de tema**: apenas o tema claro (padrão) é entregue com valores; o contrato deve permitir dark futuro, mas dark **não** é implementado aqui.
- **Localização**: `src/shared/ui/` é o lar do design system (já reservado pela constituição e enforçado pelo `eslint-plugin-boundaries` como `shared-ui`).
- **Stack**: vanilla-extract já está instalado e integrado ao build (feita no commit anterior `a1fbdf2`); esta feature o utiliza.
- **Assets de marca** (`backgroundLogin.png`, `logo-bem-comum.png`) existem na v1 e serão portados quando os componentes forem construídos — **não** fazem parte da camada de tokens.
- **TDD**: conforme prática do time, testes/validações dos tokens precedem a implementação; o tipo de teste (unitário vs. BDD) será confirmado no planejamento.
