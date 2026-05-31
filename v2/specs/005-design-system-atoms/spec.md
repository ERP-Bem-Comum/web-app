# Feature Specification: Átomos do Design System (componentes do login)

**Feature Branch**: `feat/v2-auth` (corrente; spec dir `specs/005-design-system-atoms`)

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Componentes do design system v2 (átomos do login). Criar os átomos em `src/shared/ui/atoms/` (Button, Input, Checkbox, Logo, Card) e a molécula Field em `src/shared/ui/molecules/`, consumindo os tokens (spec 004) via `vars`, seguindo Atomic Design e os linters de enforcement já configurados. Escopo: SÓ átomos (+ molécula Field) — NÃO vestir a LoginView nem portar o fundo (próxima spec)."

## Visão Geral

Esta feature entrega o **primeiro conjunto de componentes** do design system compartilhado — os **átomos** que a tela de login vai precisar — e a primeira **molécula** (`Field`). Todos consomem **exclusivamente** os design tokens (`vars`, spec 004), com fidelidade visual à v1. São **componentes burros e reutilizáveis**, isolados e testados, **ainda não montados** na tela de login (a recomposição da `LoginView` é a próxima feature).

O critério-mor é **reutilização consistente**: cada átomo encapsula um pedaço visual da identidade da marca (botão ciano, input com foco, etc.) de forma que qualquer feature o use sem reescrever estilo nem valores crus.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desenvolvedor usa os átomos para compor uma tela (Priority: P1)

Um desenvolvedor (frontend) construindo qualquer tela importa `Button`, `Input`, `Checkbox`, `Logo`, `Card` do design system compartilhado e a molécula `Field`, passando dados/handlers por props. Os componentes já vêm com a aparência da marca (cores, raio, fontes vindos dos tokens) e estados visuais (hover, foco, desabilitado, erro). Ele não escreve cor/medida crua.

**Why this priority**: É o propósito da feature — disponibilizar as peças reutilizáveis. Sem elas, cada tela reinventaria botão/input, quebrando consistência e fidelidade.

**Independent Test**: Renderizar cada átomo isoladamente (em teste) e verificar: aparência derivada de tokens, estados (disabled/loading/erro/foco) e callbacks disparando. Pode ser validado sem a tela de login.

**Acceptance Scenarios**:

1. **Given** o átomo `Button`, **When** renderizado na variante primária, **Then** apresenta a cor de marca e, em estado desabilitado/carregando, fica não-clicável e visualmente atenuado.
2. **Given** o átomo `Input`, **When** o usuário digita, **Then** o callback de mudança recebe o valor; **When** focado, **Then** há indicação visual de foco.
3. **Given** o átomo `Checkbox`, **When** alternado, **Then** o callback recebe o novo estado (marcado/desmarcado).
4. **Given** a molécula `Field`, **When** recebe um rótulo e uma mensagem de erro, **Then** exibe o rótulo associado ao controle e a mensagem de erro acessível (anunciável por leitor de tela).
5. **Given** o átomo `Logo`, **When** renderizado, **Then** mostra a marca com texto alternativo; **Given** `Card`, **When** envolve conteúdo, **Then** apresenta superfície elevada (fundo claro, cantos arredondados, sombra).

---

### User Story 2 - Manutenção sem regressão visual (Priority: P2)

Quem altera um componente (ou cria um novo) é impedido por ferramentas de introduzir valor cru (hex/px) ou de violar a hierarquia Atomic (um átomo importar uma molécula). A regressão é barrada antes do merge.

**Why this priority**: Governança — garante que a consistência conquistada não se degrade com o tempo/novos contribuidores.

**Independent Test**: Introduzir propositalmente um valor cru num átomo e um import de molécula dentro de um átomo; a verificação automatizada deve reprovar ambos.

**Acceptance Scenarios**:

1. **Given** um átomo com cor crua (hex/rgb) ou medida em px, **When** a verificação roda, **Then** ela falha apontando o uso indevido.
2. **Given** um átomo importando uma molécula (ou nível "acima"), **When** a verificação roda, **Then** ela falha por violação de hierarquia.

---

### Edge Cases

- **Estado de carregamento do botão**: enquanto carrega, o botão não dispara nova ação e comunica o estado (texto/indicador), sem quebrar o layout.
- **Erro sem rótulo / rótulo sem erro**: a molécula `Field` deve funcionar com erro ausente (sem reservar/poluir espaço indevido) e com rótulo sempre associado ao controle.
- **Foco por teclado**: todos os controles interativos (button, input, checkbox) têm indicação de foco visível (acessibilidade), derivada de token.
- **Input de senha vs e-mail**: o `Input` aceita o tipo apropriado (texto/e-mail/senha) preservando a mesma aparência.
- **Imagem do logo ausente/lenta**: o `Logo` sempre tem texto alternativo; falha de carregamento não quebra o layout do contêiner.
- **Contraste**: a combinação cor de marca + texto sobre marca mantém legibilidade (alvo WCAG AA) — agora verificável porque o componente existe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST prover um átomo **Button** com: variante primária (cor de marca), e estados **desabilitado** e **carregando** (não-clicável e visualmente distinto). Deve encaminhar o evento de clique e aceitar conteúdo textual.
- **FR-002**: O sistema MUST prover um átomo **Input** que aceite os tipos **texto, e-mail e senha**, exiba o valor recebido, encaminhe mudanças por callback, e apresente indicação visual de **foco**.
- **FR-003**: O sistema MUST prover um átomo **Checkbox** que reflita o estado marcado/desmarcado recebido e encaminhe a alternância por callback.
- **FR-004**: O sistema MUST prover um átomo **Logo** que renderize a marca com **texto alternativo** obrigatório, com dimensão configurável.
- **FR-005**: O sistema MUST prover um átomo **Card** que apresente uma **superfície elevada** (fundo claro, cantos arredondados, sombra) envolvendo conteúdo arbitrário.
- **FR-006**: O sistema MUST prover uma molécula **Field** que componha **rótulo + controle + mensagem de erro**, com o rótulo **associado** ao controle e a mensagem de erro **acessível** (anunciável por leitor de tela) quando presente.
- **FR-007**: Todos os componentes MUST derivar **100% dos valores visuais** (cores, espaçamentos, raios, tipografia, sombras) dos **design tokens** — **nenhum** valor cru (hex, px, rgb/hsl) é permitido no código de componente.
- **FR-008**: Todos os componentes MUST ser **burros**: recebem dados e callbacks por props e renderizam; **sem** busca de dados, estado de negócio, ou conhecimento de auth/rotas. Estado puramente visual local (ex.: nada além do necessário) é aceitável apenas se não for estado de negócio.
- **FR-009**: Os átomos MUST residir em `src/shared/ui/atoms/` e a molécula em `src/shared/ui/molecules/`, respeitando a **hierarquia Atomic** enforçada (átomo importa só tokens/shared; molécula importa átomos/tokens/shared) — violar é erro de verificação.
- **FR-010**: Os componentes MUST ser **acessíveis**: controles rotulados, foco visível por teclado, mensagem de erro com `role` apropriado, e textos vindos de quem consome (i18n) — **nenhum texto de UI hardcoded** dentro dos componentes.
- **FR-011**: A aparência MUST ter **fidelidade visual à v1** nos elementos cobertos (botão ciano, input com borda/raio/foco, card branco com sombra, logo) — diferença imperceptível ao usuário nos átomos entregues.
- **FR-012**: O **asset do logo** da marca MUST estar disponível na v2 para o átomo `Logo` consumir.
- **FR-013**: O escopo MUST ser **somente os componentes listados** (5 átomos + 1 molécula). **NÃO** inclui: recompor a `LoginView`, portar o fundo de login, tema dark, ou qualquer mudança na lógica de auth/MVVM.

### Key Entities *(include if feature involves data)*

- **Button**: ação primária. Props: conteúdo, `onClick`, estado (normal/disabled/loading), tipo de submit. Sem estado de negócio.
- **Input**: campo de entrada. Props: tipo (text/email/password), valor, `onChange`, estado de foco visual, identificador para associação a rótulo.
- **Checkbox**: controle booleano. Props: `checked`, `onChange`, identificador.
- **Logo**: imagem da marca. Props: dimensão, texto alternativo.
- **Card**: contêiner de superfície. Props: conteúdo (children).
- **Field** (molécula): agrega rótulo + controle + erro. Props: rótulo, mensagem de erro (opcional), o controle (composição), associação rótulo↔controle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os 5 átomos (Button, Input, Checkbox, Logo, Card) e a molécula Field estão disponíveis e importáveis pelo design system.
- **SC-002**: 100% dos componentes usam apenas tokens — zero ocorrências de cor/medida crua no código de componente (verificável automaticamente).
- **SC-003**: Cada componente possui testes que validam **comportamento** (render, callbacks, estados disabled/loading/erro/foco) e as **variantes** (mudança visual por prop), todos verdes.
- **SC-004**: A verificação reprova automaticamente (a) valor cru e (b) violação de hierarquia Atomic — comprovado com casos de teste negativos.
- **SC-005**: Comparação visual dos átomos com a v1 (botão, input, card, logo) não apresenta diferença perceptível.
- **SC-006**: Os componentes passam em verificação de acessibilidade básica (rótulo associado, foco visível, erro anunciável).

## Assumptions

- **Tokens prontos**: a camada de tokens (spec 004, `vars`) está implementada e é a única fonte de valores; estes componentes a consomem.
- **Enforcement ativo**: os linters de "só tokens" e hierarquia Atomic (configurados na spec 004) já existem; esta feature opera sob eles e os exercita.
- **MVVM intacto**: a `LoginView` atual permanece como está nesta feature; a recomposição (vestir o login) é a próxima spec — por isso o **fundo** de login não é portado aqui (só o **logo**, que o átomo `Logo` precisa).
- **Strings via props**: os componentes não embutem texto de UI; quem os usa fornece rótulos/labels (i18n na camada de página).
- **Testes**: o time usa testes de **comportamento (DOM)** para UI e **unitários** para lógica de variante — ambos serão escritos antes da implementação (TDD); o detalhe de ferramenta fica no plano.
- **Tipos de Input**: text/email/password cobrem o login; outros tipos ficam fora do escopo.
- **Logo**: porta-se o asset de logo da v1; dimensionamento configurável (default coerente com o uso no login).
