# Feature Specification: Distrato aderente ao #32 — encerrar contrato por distrato

**Feature Branch**: `020-contract-distrato`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Distrato aderente ao #32 — encerrar contrato por distrato a partir do front (web-app v2). Frontend-only, módulo contracts, aditivo, sem tocar no core-api."

## Resumo

Hoje, ao distratar um contrato pela tela, ele **não encerra** — permanece "Em Andamento". Verificado em teste real (OS 0001/2026): o usuário cria e homologa um aditivo de distrato, mas o status não muda. O backend (#32, CTR-HTTP-DISTRATO-DOCUMENTO) passou a exigir, para encerrar por distrato: um **documento assinado de distrato** anexado + a **data efetiva** + o **motivo** — e o front não envia nada disso. Esta feature alinha o **frontend** para que o distrato **encerre o contrato** (status **Distrato**), refletindo no detalhe e no grid. É frontend-only e aditiva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distratar um contrato e ele encerrar (Priority: P1)

Como usuária da gestão de contratos, quero **distratar um contrato em andamento** informando o **motivo**, a **data efetiva** do distrato e anexando o **documento assinado**, para que o contrato seja **encerrado** (status Distrato) e isso fique visível no detalhe e no grid.

**Why this priority**: É o único objetivo da feature e corrige um fluxo **hoje quebrado** (o distrato não tem efeito). Sem isso, o encerramento por distrato não funciona pela UI.

**Independent Test**: Em um contrato Em Andamento, realizar o distrato informando motivo + data efetiva + documento; confirmar que o contrato passa a **Distrato** (encerrado) no detalhe e no grid, e que a data de encerramento reflete a data efetiva informada.

**Acceptance Scenarios**:

1. **Given** um contrato **Em Andamento**, **When** a usuária realiza o distrato informando **motivo**, **data efetiva** (não-futura) e anexando o **documento** assinado, **Then** o contrato passa a **Distrato** (encerrado), com a data de encerramento = data efetiva, refletido no detalhe e no grid.
2. **Given** o formulário de distrato, **When** a usuária tenta concluir **sem o documento** assinado, **Then** o sistema impede a conclusão e exibe mensagem indicando que o documento é obrigatório.
3. **Given** o formulário de distrato, **When** a usuária tenta concluir **sem o motivo**, **Then** o sistema impede a conclusão e exibe mensagem indicando que o motivo é obrigatório.
4. **Given** o formulário de distrato, **When** a usuária informa uma **data efetiva no futuro**, **Then** o sistema impede a conclusão e exibe mensagem indicando que a data não pode ser futura.
5. **Given** uma falha do backend durante o encerramento, **When** a usuária conclui, **Then** uma mensagem amigável é exibida (sem detalhe técnico) e ela permanece na tela, sem o contrato ficar em estado inconsistente na UI.

---

### Edge Cases

- **Contrato não está Em Andamento** (já encerrado/finalizado/distratado): a ação de distrato não deve ser oferecida; se tentada, o sistema recusa com mensagem amigável (espelha o conflito do backend).
- **Documento inválido** (não-PDF / acima do limite): bloqueado na borda com mensagem clara.
- **Reflexo na leitura**: após o distrato, o contrato aparece como **Distrato** tanto no detalhe quanto no grid (sem precisar recarregar manualmente).
- **Encerramento por vencimento (Expire)**: é automático pela chegada da data-fim — **não** é uma ação desta tela (fora de escopo).
- **Distrato é passo-único** (ratificado 2026-06-10): diferente dos aditivos de valor/prazo, o distrato **não** pode ser salvo como Pendente (sem documento) — exige documento + data efetiva + data de assinatura para concluir, e já encerra o contrato. Sem o documento, o botão "Salvar Aditivo" fica desabilitado (espelha a exigência do backend de que sem `signed_termination` não há encerramento).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A usuária MUST poder iniciar o distrato de um contrato **Em Andamento**, informando **motivo**, **data efetiva** e anexando o **documento assinado** do distrato.
- **FR-002**: O **motivo** MUST ser obrigatório (não-vazio); sem ele, o app MUST impedir a conclusão com mensagem clara.
- **FR-003**: A **data efetiva** MUST ser obrigatória e **não-futura**; inválida → o app MUST impedir a conclusão com mensagem clara.
- **FR-004**: O **documento assinado** do distrato MUST ser obrigatório; ausente → o app MUST impedir a conclusão com mensagem clara (espelhando a exigência do backend).
- **FR-005**: Ao concluir com sucesso, o contrato MUST passar a **Distrato** (encerrado), com a **data de encerramento** refletindo a data efetiva informada, visível no **detalhe** e no **grid** sem recarga manual.
- **FR-006**: Erros do backend (motivo/data/documento recusados, ou contrato em estado que não permite distrato) MUST ser apresentados como **mensagens amigáveis**, sem expor detalhe técnico, mantendo a usuária na tela.
- **FR-007**: A ação de distrato MUST ser oferecida **apenas** para contratos em que ela é válida (Em Andamento); não deve aparecer/permitir para contratos já encerrados.
- **FR-008**: A feature MUST ser **aditiva**, sem regressão no detalhe, grid, criação, aditivos (homologação) nem em outros módulos.

### Key Entities *(include if feature involves data)*

- **Distrato (intenção de encerramento)**: o que a usuária fornece para encerrar um contrato — **motivo** (texto justificando), **data efetiva** (quando o distrato passa a valer) e **documento assinado** (comprovante do distrato).
- **Contrato (resultado)**: após o distrato, fica em estado **Distrato** (encerrado), com **data de encerramento** = data efetiva; demais dados preservados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos distratos concluídos com dados válidos (motivo + data efetiva + documento) **encerram** o contrato (status Distrato) — taxa de sucesso do fluxo = 100% nos cenários válidos.
- **SC-002**: O contrato distratado aparece como **Distrato** no detalhe e no grid imediatamente após a conclusão (sem recarga manual).
- **SC-003**: Tentativas inválidas (sem documento, sem motivo, data futura) são **bloqueadas com mensagem clara** em 100% dos casos — nenhuma chamada quebra a tela.
- **SC-004**: **Zero regressões** no detalhe/grid/criação/aditivos/demais módulos — verificado por `pnpm verify` + `pnpm test:dom` e checagem em tela.

## Impacto Arquitetural *(frontend — web-app v2)*

> Spec do repositório **web-app v2 (frontend)**. A seção do template voltada ao core-api é **N/A**.

- **Toca core-api?** **Não.** Frontend-only; consome o contrato do `/contracts/:id/end` + upload de documento já entregues no #32.
- **Módulo afetado**: `src/modules/contracts/` (fluxo de distrato no detalhe: UI + binding/mutation + server-fn + use-case + client adapter do `end`/upload).
- **Fronteira client↔server**: server functions (única fronteira); validação Zod na borda (input da server fn + response do core-api).
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; design system **só-tokens**; strings de UI = **tags i18n**; **views burras** (sem `useQuery`/`useMutation` em page/component); boundaries por `public-api`; naming por postfix.
- **Risco principal**: ordem obrigatória (anexar o documento de distrato **antes** do encerramento) e o threading de **motivo + data efetiva** por várias camadas (client→use-case→server-fn→mutation→binding→UI).

## Assumptions

- O backend do **#32** (já no `dev`) é a referência: encerrar por distrato exige **documento assinado de distrato** anexado + `data efetiva` (não-futura) + `motivo` no encerramento; sem documento → recusa; o resultado é o contrato **encerrado** (Distrato) com data de encerramento = data efetiva.
- O distrato é **iniciado a partir do detalhe do contrato** (onde hoje já existe a noção de aditivo de distrato). A spec não fixa se a captura de motivo/data/documento acontece num passo único ou reaproveita o fluxo de aditivo de distrato existente — isso é decisão do plano; o que importa é o **resultado** (contrato encerrado) e os **inputs** (motivo, data efetiva, documento).
- **Motivo** e **data efetiva** são fornecidos pela usuária no ato do distrato (o motivo pode reaproveitar a descrição/justificativa do distrato; a data efetiva pode reaproveitar a data de assinatura/efeito) — detalhe de origem fica no plano.
- Banco local com o backend #32; validação em tela com `admin.full@bemcomum.dev`.
- **Fora de escopo** (slices separados): **cancelamento** de contrato Pending (vira Cancelled), e **encerramento por vencimento** (Expire, automático por data) — nenhum dos dois é ação desta tela.
