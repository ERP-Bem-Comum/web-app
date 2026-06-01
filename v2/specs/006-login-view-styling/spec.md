# Feature Specification: Login com a identidade visual (design system)

**Feature Branch**: `006-login-view-styling`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Vestir a LoginForm da v2 com o design system e dar fidelidade visual à v1 — trocar o HTML cru por Card/Logo/Field/Input/Checkbox/Button, reproduzir o enquadramento do login da v1 (fundo + card branco centralizado + logo + ciano), sem mudar o comportamento de autenticação."

## Clarifications

### Session 2026-05-31

- Q: Manter o checkbox "lembrar dispositivo" (a v1 não tinha)? → A: Manter — não regredir a funcionalidade já existente na v2.
- Q: Como o botão comunica o estado "enviando"? → A: Spinner em CSS (anel único, `conic-gradient` + `mask`) no estado `loading` do **átomo Button** — substitui o rótulo durante o envio (botão mantém o tamanho), cor onBrand, ~0.8s. Respeita `prefers-reduced-motion` (suavizado, não removido) e expõe nome acessível "carregando" (aria-busy + texto visualmente oculto). NÃO troca o texto para "Entrando…" (descartado por parecer amador).
- Q: Incluir o subtítulo abaixo do título (a v1 tinha "Entre com suas credenciais")? → A: Incluir um subtítulo curto, via catálogo de textos (i18n).
- Q: Os campos Email/Senha terão placeholder? → A: Incluir placeholders via i18n (e-mail de exemplo + senha mascarada).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login com a identidade visual do produto (Priority: P1)

Quem precisa entrar no ERP abre a tela de login e encontra a identidade visual consolidada da marca — fundo característico, um cartão centralizado contendo o logotipo, os campos e o botão na cor da marca — em vez de um formulário sem acabamento. A pessoa reconhece o produto e sente que ele é confiável e profissional.

**Why this priority**: A tela de login é o cartão de visitas do produto e a primeira impressão a cada acesso. Hoje ela está crua (sem estilo), o que passa sensação de inacabado. Esta história sozinha já entrega praticamente todo o valor da feature.

**Independent Test**: Abrir a tela de login deslogado e verificar que aparece o fundo da marca, um cartão branco centralizado com logotipo, título, campos e botão na cor da marca — e que o login continua funcionando normalmente.

**Acceptance Scenarios**:

1. **Given** uma pessoa deslogada, **When** ela acessa a tela de login, **Then** vê o fundo da marca cobrindo a tela e um cartão centralizado (horizontal e verticalmente) contendo logotipo, título, campos de e-mail e senha e o botão de entrar na cor da marca.
2. **Given** a tela de login remodelada, **When** a pessoa envia credenciais válidas, **Then** é autenticada e redirecionada exatamente como antes da remodelagem.
3. **Given** credenciais inválidas, **When** a pessoa envia, **Then** vê uma mensagem de erro destacada (bloco de alerta) sem perder o que digitou.

---

### User Story 2 - Login acessível e com feedback claro (Priority: P2)

Quem usa teclado ou leitor de tela consegue operar todo o login: navega pelos campos com foco sempre visível, cada campo tem rótulo associado, o estado de carregamento é comunicado e os erros são anunciados — sem depender só de cor.

**Why this priority**: Acessibilidade é requisito do produto (ERP de uso amplo) e barata de garantir porque os componentes do design system já trazem foco visível e semântica. Refina a P1 sem alterar o fluxo.

**Independent Test**: Operar o login apenas com o teclado e verificar foco visível em cada controle, rótulos associados, anúncio do erro e comunicação do estado "entrando".

**Acceptance Scenarios**:

1. **Given** navegação por teclado, **When** a pessoa tabula pelos controles, **Then** cada campo e o botão exibem um indicador de foco visível.
2. **Given** um erro de autenticação, **When** ele ocorre, **Then** é anunciado às tecnologias assistivas (papel de alerta) e a cor não é o único indicador.
3. **Given** o envio em andamento, **When** a pessoa aciona entrar, **Then** o botão fica desabilitado e comunica o estado de carregamento.

---

### User Story 3 - Fidelidade visual à versão anterior (Priority: P3)

Quem já usava o produto na versão anterior encontra praticamente o mesmo enquadramento de login (fundo, cartão centralizado, logotipo no topo, botão na cor da marca), de modo que a migração não cause estranhamento.

**Why this priority**: A continuidade visual reduz atrito na migração, mas é a menos crítica — desde que a identidade da marca (P1) e a acessibilidade (P2) estejam garantidas, pequenas diferenças de enquadramento são toleráveis.

**Independent Test**: Comparar lado a lado a tela nova com a da versão anterior e confirmar que o enquadramento (fundo, cartão, logotipo, cor do botão) corresponde.

**Acceptance Scenarios**:

1. **Given** a tela de login nova e a anterior lado a lado, **When** comparadas, **Then** o enquadramento geral (fundo cobrindo a tela, cartão branco centralizado, logotipo no topo, botão na cor da marca) corresponde.

---

### Edge Cases

- **Tela estreita (mobile/janela pequena)**: o cartão se adapta sem transbordar e permanece legível e utilizável.
- **Imagem de fundo não carrega**: uma cor de fundo de fallback mantém o contraste e a legibilidade do cartão.
- **Envio em andamento**: o botão fica desabilitado e comunica "entrando", evitando envio duplicado.
- **Mensagem de erro longa**: o bloco de alerta acomoda o texto sem quebrar o layout do cartão.
- **Conteúdo digitado preservado**: ao receber erro, e-mail e estado de "lembrar" permanecem (não força recomeço).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de login MUST apresentar o conteúdo sobre o fundo característico da marca, com o cartão centralizado horizontal e verticalmente.
- **FR-002**: O cartão MUST exibir o logotipo da marca no topo.
- **FR-003**: A tela MUST exibir um título que identifique o produto **e** um subtítulo curto de apoio, ambos vindos do catálogo de textos (i18n).
- **FR-004**: Os campos de e-mail e senha MUST usar o componente de campo do design system (rótulo associado ao controle), com texto de exemplo (placeholder).
- **FR-005**: A opção "lembrar dispositivo" MUST permanecer disponível na tela (não regredir funcionalidade já existente).
- **FR-006**: O botão de envio MUST ser o botão primário da marca, ocupar a largura útil do cartão e comunicar o estado de carregamento durante o envio — botão desabilitado **e** um indicador animado (spinner) em CSS, sem trocar o texto por um rótulo de carregando. O indicador MUST permanecer funcional sob `prefers-reduced-motion` (suavizado, não removido) e MUST ter alternativa textual acessível (estado "carregando" anunciado às tecnologias assistivas).
- **FR-007**: Erros de autenticação MUST ser exibidos em um bloco de alerta destacado, anunciado às tecnologias assistivas, preservando o conteúdo já digitado.
- **FR-008**: Toda a aparência (cores, tipografia, espaçamento, raio, sombra) MUST derivar do sistema de identidade da marca, sem valores ad-hoc.
- **FR-009**: O comportamento de autenticação (validação local, envio, sessão, redirecionamento e mensagens) MUST permanecer idêntico ao atual — apenas a apresentação muda.
- **FR-010**: A tela MUST ser operável por teclado, com foco visível em cada controle e rótulos associados aos campos.
- **FR-011**: O fundo da marca MUST ter uma cor de fallback caso a imagem não carregue, preservando contraste e legibilidade.
- **FR-012**: A tela MUST permanecer legível e utilizável em larguras estreitas, sem que o cartão transborde.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma pessoa reconhece a identidade da marca na tela de login (fundo, cartão, logotipo, cor primária) já no primeiro acesso, sem instruções.
- **SC-002**: 100% da aparência da tela usa a paleta e as medidas oficiais da marca — zero valores de cor/medida ad-hoc.
- **SC-003**: Nenhuma regressão de comportamento: o fluxo completo de login (sucesso, erro, "lembrar dispositivo", redirecionamento) funciona exatamente como antes da remodelagem.
- **SC-004**: A tela é 100% operável por teclado, com foco visível em todos os controles e o erro anunciado a leitores de tela.
- **SC-005**: A tela tem fidelidade visual à versão anterior ao ponto de o usuário "quase não perceber diferença" no enquadramento.
- **SC-006**: A tela permanece legível e sem transbordo em larguras a partir de ~320px.

## Assumptions

> As decisões de produto foram **confirmadas na sessão de Clarifications (2026-05-31)** (ver seção Clarifications). Os textos exatos (título, subtítulo, placeholders) permanecem decisão de conteúdo do P.O. (@lekadecastro).

- **Lembrar dispositivo**: mantido (confirmado) — já existe na v2 e está integrado ao fluxo; a versão anterior não tinha esse controle.
- **Subtítulo**: incluído (confirmado) — subtítulo curto abaixo do título, via catálogo de textos (i18n).
- **Botão "enviando"**: spinner em CSS (anel único `conic-gradient` + `mask`) no estado `loading` do átomo Button (confirmado) — melhoria do design system (spec 005) que o login consome; sem troca de rótulo. Requer nome acessível "carregando" (aria-busy + texto oculto), não a tag "Entrando…".
- **Título e placeholders**: via catálogo de textos (i18n) (confirmado); os textos exatos são conteúdo do P.O.
- **Reuso**: a feature reutiliza o fluxo/contrato de autenticação existente (spec 002), os componentes do design system (spec 005) e os tokens da marca (spec 004) — nenhum backend novo.
- **Asset**: a imagem de fundo da versão anterior será portada para o projeto (o logotipo já foi portado na spec 005).
- **Tokens faltantes**: se a remodelagem exigir um valor ainda não tokenizado (ex.: largura máxima do cartão, cor de fundo de fallback), o valor será adicionado ao sistema de tokens da marca, nunca embutido cru.

## Dependencies

- Fluxo de autenticação (spec 002 — `auth`): contrato e comportamento reutilizados sem alteração.
- Design system (spec 005): componentes Button, Input, Checkbox, Logo, Card e Field.
- **Melhoria do átomo Button (spec 005)**: o estado `loading` do Button ganha um spinner em CSS (anel `conic-gradient` + `mask`, respeitando `prefers-reduced-motion` + nome acessível) — tarefa **foundational** desta feature; o login consome o Button já com o spinner. Pode exigir token(s) novo(s) de dimensão do spinner (propor em tokens.values.ts).
- Tokens da marca (spec 004): paleta, tipografia, espaçamento, raio e sombra.
- Asset de fundo da versão anterior a ser portado.
