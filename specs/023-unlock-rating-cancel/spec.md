# Feature Specification: Destravar avaliação de fornecedor (§1.6) + cancelamento de contrato (§1.7)

**Feature Branch**: `feat/act-acordo-022` (ou branch própria) · spec dir `023-unlock-rating-cancel`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Destravar 2 features que o backend #32 já entregou mas o front mantém desabilitadas com comentário desatualizado — avaliação de fornecedor (§1.6) e cancelamento de contrato Pendente (§1.7). Frontend-only, aditivo, sem tocar core-api."

## Resumo

Duas capacidades já entregues no backend **#32** estão **desabilitadas no front** com comentários **desatualizados**:

- **§1.6 — Avaliação de fornecedor**: os campos **nível de avaliação** e **comentário** existem no formulário de fornecedor mas estão **desabilitados** ("sem suporte no backend ainda"). O #32 passou a aceitar/retornar esses dados.
- **§1.7 — Cancelamento de contrato**: existe uma modal de "excluir contrato" **desabilitada** ("o backend proíbe exclusão"). O #32 passou a permitir **cancelar** (soft) um contrato **Pendente** → status **Cancelado** (não é exclusão física); contrato não-Pendente é recusado.

Esta feature **destrava** as duas (frontend-only, aditivo): habilita a avaliação no cadastro/edição/detalhe do fornecedor, e o cancelamento de contratos Pendentes pela UI, refletindo o status **Cancelado** no grid e no detalhe — com mensagens amigáveis nos erros. São duas user stories independentes (módulos diferentes); qualquer uma entrega valor sozinha.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Avaliar um fornecedor (Priority: P1)

Como gestora de parceiros, quero **registrar a avaliação de serviço** de um fornecedor (um nível — ruim/regular/bom/ótimo — e um comentário opcional) no cadastro e na edição, e **vê-la no detalhe**, para acompanhar a qualidade dos fornecedores.

**Why this priority**: É uma capacidade pronta no backend que hoje aparece **desabilitada** (frustra a usuária). Destravá-la entrega valor imediato sem depender de nada.

**Independent Test**: Cadastrar/editar um fornecedor escolhendo um nível de avaliação + comentário; confirmar que persiste e aparece no detalhe; e que "sem avaliação" também é válido.

**Acceptance Scenarios**:

1. **Given** o formulário de fornecedor, **When** escolho um **nível de avaliação** (ruim/regular/bom/ótimo) e (opcional) um **comentário** e salvo, **Then** o fornecedor é salvo com a avaliação e ela aparece no **detalhe**.
2. **Given** o formulário, **When** **não** escolho avaliação, **Then** o fornecedor é salvo **sem avaliação** (campo opcional), sem erro.
3. **Given** um fornecedor avaliado, **When** abro a **edição**, **Then** o nível e o comentário vêm pré-carregados e podem ser alterados/limpos.
4. **Given** os campos de avaliação, **When** a tela carrega, **Then** eles estão **habilitados** (sem o aviso de "indisponível").

---

### User Story 2 - Cancelar um contrato Pendente (Priority: P1)

Como usuária da gestão de contratos, quero **cancelar um contrato que ainda está Pendente** (que nunca foi efetivado), confirmando a ação, para que ele saia do fluxo ativo com status **Cancelado** — sem apagar o registro.

**Why this priority**: Capacidade pronta no backend, hoje **bloqueada** na UI por comentário desatualizado. Resolve a necessidade real de descartar um contrato criado por engano/desistido, sem exclusão física.

**Independent Test**: Em um contrato **Pendente**, acionar o cancelamento, confirmar, e ver o contrato passar a **Cancelado** no grid e no detalhe; tentar cancelar um contrato **não-Pendente** é recusado com mensagem clara.

**Acceptance Scenarios**:

1. **Given** um contrato **Pendente**, **When** aciono "cancelar" e confirmo, **Then** o contrato passa a **Cancelado** e isso reflete no **grid** e no **detalhe** (sem recarga manual).
2. **Given** um contrato **não-Pendente** (Em Andamento/Distrato/Finalizado), **When** tento cancelar, **Then** a ação **não é oferecida**; se acionada, o sistema recusa com mensagem amigável ("apenas contratos pendentes podem ser cancelados").
3. **Given** a confirmação de cancelamento, **When** desisto, **Then** nada muda.
4. **Given** uma falha do backend, **When** confirmo, **Then** uma mensagem amigável é exibida (sem detalhe técnico), mantendo a usuária na tela.

---

### Edge Cases

- **Cancelar ≠ excluir**: o contrato **não** é apagado — fica **Cancelado** (registro preservado). A UI deve falar "cancelar", não "excluir".
- **Avaliação opcional**: ausência de nível/comentário é válida; limpar uma avaliação existente também.
- **Status novo no grid/detalhe**: contratos **Cancelado** aparecem com rótulo/cor próprios, distintos de Pendente/Em Andamento/Distrato/Finalizado.
- **Falha de backend**: erros (não-Pendente, indisponibilidade) viram mensagens amigáveis; sem quebrar a tela.
- **Sem regressão**: demais fluxos de fornecedor e de contrato (criação, aditivos, distrato, detalhe, grid) continuam funcionando.

## Requirements *(mandatory)*

### Functional Requirements

**Avaliação de fornecedor (US1)**

- **FR-001**: O cadastro e a edição de fornecedor MUST permitir registrar um **nível de avaliação** (entre os níveis oferecidos: ruim/regular/bom/ótimo) e um **comentário** opcional.
- **FR-002**: A avaliação MUST ser **opcional** — salvar sem nível/comentário é válido; uma avaliação existente pode ser **alterada ou removida** na edição.
- **FR-003**: O **detalhe** do fornecedor MUST exibir a avaliação (nível + comentário) quando houver.
- **FR-004**: Os campos de avaliação MUST estar **habilitados** (remover o estado "indisponível"/desabilitado atual).

**Cancelamento de contrato (US2)**

- **FR-005**: A usuária MUST poder **cancelar** um contrato **Pendente** pela UI, com **confirmação** antes de efetivar.
- **FR-006**: A ação de cancelar MUST ser oferecida **apenas** para contratos **Pendentes**; para os demais, não aparece/permite.
- **FR-007**: Ao cancelar com sucesso, o contrato MUST passar a **Cancelado** e refletir no **grid** e no **detalhe** sem recarga manual; o registro **não** é apagado.
- **FR-008**: Tentar cancelar um contrato não-Pendente (ou outra falha) MUST ser apresentado como **mensagem amigável**, sem detalhe técnico, mantendo a usuária na tela.
- **FR-009**: A UI MUST tratar o cancelamento como **"cancelar"** (não "excluir") — o registro é preservado como Cancelado.

**Comuns**

- **FR-010**: As duas capacidades MUST ser **frontend-only** e **aditivas**, sem regressão nos demais fluxos de fornecedor e de contrato.

### Key Entities *(include if feature involves data)*

- **Avaliação de fornecedor**: parte do fornecedor — **nível** (ruim/regular/bom/ótimo) e **comentário** (texto opcional). Ambos opcionais.
- **Contrato (status)**: ganha o estado **Cancelado** (resultado de cancelar um contrato Pendente). Distinto de Pendente/Em Andamento/Distrato/Finalizado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos fornecedores salvos com avaliação válida (com ou sem comentário) **persistem** a avaliação e a exibem no detalhe; salvar sem avaliação também funciona.
- **SC-002**: Os campos de avaliação aparecem **habilitados** — nenhum estado "indisponível" remanescente.
- **SC-003**: 100% dos cancelamentos de contratos **Pendentes** resultam em **Cancelado** no grid e no detalhe (sem recarga); cancelar não-Pendente é **bloqueado/avisado** em 100% dos casos.
- **SC-004**: Contratos **Cancelado** são exibidos com rótulo/cor próprios em todas as telas que mostram status.
- **SC-005**: **Zero regressões** em fornecedor/contrato e demais módulos — verificado por `pnpm verify` + `pnpm test:dom` e checagem em tela.

## Impacto Arquitetural *(frontend — web-app v2)*

> Spec do repositório **web-app v2 (frontend)**. A seção do template voltada ao core-api é **N/A**.

- **Toca core-api?** **Não.** Frontend-only; consome o que o #32 já entregou (avaliação de fornecedor; `DELETE /contracts/:id` → Cancelled).
- **Módulos afetados**: `src/modules/partners/` (recurso **supplier** — US1) e `src/modules/contracts/` (US2). Independentes.
- **Fronteira client↔server**: server functions (única fronteira); validação Zod na borda.
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; só-tokens; i18n; views burras; boundaries por `public-api`; naming por postfix; **switch exaustivo** — adicionar **Cancelado** ao status de contrato exige tratar em **todos** os switches de status (rótulo/cor/badge).
- **Risco principal**: o status **Cancelado** novo precisa ser tratado em todos os pontos que fazem `switch` sobre o status do contrato (senão quebra o build/guard `never`) — bom (o lint força a completude).

## Assumptions

- O backend do **#32** (já no `dev`) é a referência: fornecedor aceita/retorna `serviceRating` (níveis ruim/regular/bom/ótimo, ou nenhum) + `ratingComment`; há um catálogo de níveis disponível. Cancelamento: `DELETE /contracts/:id` cancela (soft) um contrato **Pendente** → **Cancelled**; não-Pendente → recusa (conflito).
- O front já tem os **campos de avaliação** (hoje desabilitados) e a **modal de cancelamento** (hoje desabilitada) — esta fatia os **habilita** e religa, sem criar telas novas.
- Níveis de avaliação podem vir do catálogo do backend **ou** de um conjunto fixo conhecido (ruim/regular/bom/ótimo) com fallback — decisão de mecanismo fica no plano.
- **Fora de escopo**: ACT/Acordo (§1.1 — fatia 022 em andamento), senha (021), numeração/distrato (já feitos), municípios cross-state (§1.8), qualquer mudança no core-api, e regressões nos demais fluxos.
