# Feature Specification: Política de senha alinhada ao #32 (mínimo 12)

**Feature Branch**: `021-password-policy`

**Created**: 2026-06-10 · **Revisada**: 2026-06-10 (escopo corrigido após auditoria do código real)

**Status**: Draft

**Input**: User description: "Política de senha alinhada ao #32 (web-app v2, frontend-only) — alinhar a validação de senha do front à regra do backend (mínimo 12 caracteres), consumindo a fonte única do backend em vez de número fixo."

## Resumo

O backend (#32) elevou o mínimo de senha de **8 → 12 caracteres** e publica essa regra como **fonte única** (`GET /api/v2/auth/password-policy` → `{ minLength, maxLength }` = `{12, 128}`, público). O **frontend está desatualizado**: valida senha com mínimo **8 fixo** (e um máximo **15** espúrio).

**Achado da auditoria (corrige a premissa inicial):** hoje o front tem **um único** fluxo que coleta senha nova — **Trocar Senha (Minha Conta)**. O **cadastro de usuário NÃO coleta senha** (é por convite/e-mail: só `name/cpf/email/telefone`), e a **redefinição por recuperação não existe** (o link "Esqueci Minha Senha" no login é um `href="#"` morto). Logo, o bug real é **estreito**: pega só quem troca a própria senha com 8–11 caracteres (o front aceita, o backend recusa com `password-too-short` → erro confuso).

Esta feature alinha o **único fluxo existente** (Trocar Senha) à política do backend, **consumindo a fonte única** em vez do número fixo, e deixa essa leitura como **infra reutilizável** para quando os fluxos de cadastro-com-senha/recuperação forem construídos. É **frontend-only** e aditiva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trocar a própria senha com senha válida (Priority: P1)

Como usuária, quero que **Trocar Senha (Minha Conta)** exija desde o front uma senha que o backend aceite (mínimo 12), com orientação clara, para concluir sem tomar um erro confuso do servidor.

**Why this priority**: É o **único** fluxo do front que coleta senha nova e o **único** onde o bug acontece hoje (senha de 8–11 passa no front e falha no backend com `password-too-short`).

**Independent Test**: Na modal de Trocar Senha, digitar uma senha com menos de 12 caracteres → o app **bloqueia** com mensagem clara informando o mínimo; com 12+ (dentro do máximo) → conclui e o backend aceita.

**Acceptance Scenarios**:

1. **Given** a modal de Trocar Senha, **When** a nova senha tem **menos de 12** caracteres, **Then** o app **impede** a conclusão e exibe a regra (mínimo de caracteres exigido).
2. **Given** a modal, **When** a nova senha tem **12+** caracteres (≤ máximo), **Then** o app permite concluir e o backend aceita.
3. **Given** a indicação de tamanho mínimo exibida, **When** a modal abre, **Then** o número mínimo mostrado vem da **fonte única do backend** (não de um valor fixo desatualizado).
4. **Given** o backend recusar a senha por política (tamanho ou senha comum), **When** a usuária conclui, **Then** o app exibe **mensagem amigável** (sem detalhe técnico) e ela permanece na tela.

---

### Edge Cases

- **Fonte única indisponível**: se o app não conseguir obter a regra no momento, assume um **mínimo seguro (12)** e nunca permite concluir abaixo disso (nunca mais permissivo que o backend).
- **Senha acima do máximo**: bloqueada com mensagem clara (corrige o teto **15** espúrio → passa a refletir o máximo do backend, 128).
- **Senha comum/fraca recusada pelo backend**: além do tamanho, o backend pode recusar senhas comuns; o app mostra a mensagem amigável correspondente, sem inventar regras de complexidade que o backend não tem.
- **Regras de complexidade pré-existentes**: a modal hoje já exige maiúscula/minúscula/dígito/símbolo (mais rígido que o backend, e **seguro** — toda senha que passa no front é aceita lá). Esta fatia **não remove** essas regras (seria mudança de comportamento fora de escopo); só corrige o **tamanho** (8→12, 15→128).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O fluxo de **Trocar Senha (Minha Conta)** — único que coleta senha nova no front hoje — MUST aplicar o **mínimo de tamanho da fonte única do backend** (atualmente 12), em vez de um valor fixo no front. (Os fluxos de cadastro-com-senha e recuperação não existem ainda; quando criados, reusam a mesma fonte — ver FR-007.)
- **FR-002**: O app MUST **impedir a conclusão** quando a senha for menor que o mínimo, com mensagem clara que **informa o mínimo exigido**.
- **FR-003**: O app MUST respeitar o **máximo** da fonte única (atualmente 128), corrigindo o teto **15** atual.
- **FR-004**: A indicação de tamanho mínimo exibida MUST refletir o valor **vindo da fonte única** (não um número embutido).
- **FR-005**: Se a fonte única estiver indisponível, o app MUST usar um **mínimo seguro (12)** e nunca permitir conclusão abaixo dele.
- **FR-006**: Recusas do backend por política de senha (tamanho ou senha comum) MUST ser apresentadas como **mensagens amigáveis**, sem detalhe técnico, mantendo a usuária na tela.
- **FR-007**: A leitura da política MUST ser exposta como **infra reutilizável** (não acoplada só a esta tela), para os futuros fluxos de cadastro-com-senha/recuperação reusarem a mesma regra.
- **FR-008**: A feature MUST ser **aditiva**, sem regressão na Trocar Senha (incl. as regras de complexidade existentes), no restante de auth/usuários, nem em outros módulos.

### Key Entities *(include if feature involves data)*

- **Política de senha**: regra publicada pelo backend — **tamanho mínimo** e **tamanho máximo**. Fonte de verdade que o front consome para validar e orientar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das tentativas com senha abaixo do mínimo são **bloqueadas no front** com mensagem clara — nenhuma chega ao backend só para voltar com erro confuso.
- **SC-002**: O mínimo aplicado/exibido pelo front **coincide** com o do backend (sem divergência).
- **SC-003**: O teto espúrio (15) deixa de bloquear senhas válidas; passa a valer o máximo do backend (128).
- **SC-004**: **Zero regressões** na Trocar Senha (incl. complexidade existente), auth/usuários e demais módulos — verificado por `pnpm verify` + `pnpm test:dom` e checagem em tela.

## Impacto Arquitetural *(frontend — web-app v2)*

> Spec do repositório **web-app v2 (frontend)**. A seção do template voltada ao core-api é **N/A**.

- **Toca core-api?** **Não.** Frontend-only; consome `GET /api/v2/auth/password-policy` e o `change-password` já entregues no #32.
- **Módulos afetados**: `src/modules/auth/` (leitura da política — o endpoint é de auth — exposta via `public-api`) e `src/modules/users/` (validador de senha + schema de borda da troca de senha + a modal de Trocar Senha em Minha Conta).
- **Fronteira client↔server**: server function (única fronteira); validação Zod na borda (response do core-api).
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; design system **só-tokens**; strings de UI = **tags i18n**; **views burras** (sem `useQuery`/`useMutation` em page/component); boundaries por `public-api`; naming por postfix.
- **Risco principal**: aplicar a regra **dinâmica** (com fallback seguro) sem regressão na validação existente da modal (incluindo as regras de complexidade que permanecem).

## Assumptions

- O backend do **#32** (já no `dev`) é a referência: `GET /api/v2/auth/password-policy` → `{ minLength: 12, maxLength: 128 }` (público, sem auth); `change-password` recusa senha curta com `password-too-short` (422) e pode recusar senhas comuns.
- **Único fluxo com senha nova no front hoje** = Trocar Senha (Minha Conta). Cadastro de usuário é por convite (sem senha) e recuperação por link não existe → **fora de escopo** desta fatia; quando construídos, reusarão a infra de leitura da política (FR-007).
- As **regras de complexidade** atuais da modal (maiúscula/minúscula/dígito/símbolo) são pré-existentes e **permanecem** (são stricter/safe); esta fatia só corrige o **tamanho**.
- **Fora de escopo**: adicionar/remover regras de complexidade; cadastro-com-senha e recuperação (não existem no front); qualquer mudança no core-api; demais breaking changes do #32 (ACT §1.1, cancelamento §1.7, avaliação de fornecedor §1.6).
