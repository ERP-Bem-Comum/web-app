# Feature Specification: Estados e Municípios como submódulos separados (partners)

**Feature Branch**: `016-states-municipalities-screens`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Separar 'Geografia de Parceria' (feature 014, implementada como UMA tela combinada) em DOIS submódulos independentes no menu Gestão de Parceiros: 'Estados' e 'Municípios'. Frontend-only, reaproveitando o lado servidor existente (mesma permissão geography:read/write, 4 server functions). Decisão da stakeholder; supersede o design da 014."

## Contexto e Governança

> **Mudança de escopo de produto — não é correção de bug.** A feature **014-geography-screens** foi
> entregue como **uma única tela combinada** ("Geografia de Parceria": dois painéis — estados à esquerda,
> municípios à direita). A stakeholder definiu que o escopo correto do projeto (e do legado v1) é tratar
> **Estados** e **Municípios** como **dois submódulos distintos**. Esta spec **supersede o design da 014**
> e deve ser **alinhada com o tech lead** antes da implementação, por divergir de uma decisão documentada.

Escopo desta feature: **somente o frontend** (web-app/v2, módulo `partners`). O lado servidor já existe e
**não muda**: as quatro operações de geografia (listar estados-parceiros, listar municípios por UF,
alternar estado-parceiro, alternar município-parceiro) e a permissão única `geography:read`/`geography:write`
são reaproveitadas como estão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submódulo Estados (Priority: P1)

Como administrador/ABC, quero um submódulo "Estados" onde vejo todas as UFs e marco/desmarco cada uma
como abrangência de parceria, para gerir a cobertura territorial por estado de forma independente.

**Why this priority**: É a metade mais autônoma do escopo (a lista de estados não depende de seleção
prévia) e entrega valor sozinha.

**Independent Test**: Acessar "Estados" pelo menu (`/parceiros/estados`), ver a lista de UFs com o
marcador de parceria, alternar uma UF e confirmar que o novo estado é refletido (e revertido em caso de
erro).

**Acceptance Scenarios**:

1. **Given** o submódulo Estados, **When** a tela carrega, **Then** todas as UFs aparecem com seu marcador de "é parceiro" (ligado/desligado).
2. **Given** uma UF, **When** o usuário alterna o marcador, **Then** a mudança é refletida imediatamente (otimista) e confirmada pelo servidor.
3. **Given** uma falha do servidor ao alternar, **When** a confirmação não vem, **Then** o marcador reverte ao estado anterior e uma mensagem amigável é exibida.
4. **Given** um usuário sem permissão de escrita, **When** vê a lista, **Then** os toggles ficam desabilitados (só leitura).

---

### User Story 2 - Submódulo Municípios (Priority: P1)

Como administrador/ABC, quero um submódulo "Municípios" onde escolho um estado (UF) e marco/desmarco
seus municípios como abrangência de parceria, para gerir a cobertura no nível municipal.

**Why this priority**: Completa o escopo territorial. Tem prioridade P1 junto com Estados porque o
objetivo da mudança é justamente ter os dois submódulos.

**Independent Test**: Acessar "Municípios" pelo menu (`/parceiros/municipios`), escolher uma UF no
seletor, ver os municípios daquela UF com marcador, alternar um município e confirmar o resultado.

**Acceptance Scenarios**:

1. **Given** o submódulo Municípios, **When** a tela carrega, **Then** um seletor de Estado (UF) é apresentado e a lista de municípios fica vazia/instruída até uma UF ser escolhida.
2. **Given** uma UF selecionada, **When** a lista carrega, **Then** os municípios daquela UF aparecem com seu marcador de parceria.
3. **Given** um município, **When** o usuário alterna o marcador, **Then** a mudança é otimista e confirmada (revertendo em erro, com mensagem).
4. **Given** um usuário sem permissão de escrita, **When** vê os municípios, **Then** os toggles ficam desabilitados.

---

### User Story 3 - Navegação e visibilidade dos submódulos (Priority: P2)

Como usuário com a permissão adequada, quero ver "Estados" e "Municípios" como itens separados em
"Gestão de Parceiros", para navegar diretamente a cada um.

**Why this priority**: Necessária para a descoberta, mas depende das telas (US1/US2) existirem.

**Independent Test**: Com `geography:read`, ver os dois itens no menu; sem a permissão, não ver nenhum
dos dois; o antigo item combinado não aparece mais.

**Acceptance Scenarios**:

1. **Given** um usuário com `geography:read`, **When** abre o menu "Gestão de Parceiros", **Then** vê dois subitens: "Estados" e "Municípios".
2. **Given** um usuário sem `geography:read`, **When** abre o menu, **Then** não vê nenhum dos dois subitens.
3. **Given** a navegação anterior combinada, **When** o usuário acessa a rota antiga de geografia, **Then** ela não está mais ativa como submódulo (substituída pelas duas novas).

---

### Edge Cases

- **UF sem municípios partner / lista vazia**: a tela de Municípios mostra estado vazio amigável após escolher a UF.
- **Nenhuma UF selecionada ainda** (Municípios): instrução clara para escolher um estado antes de listar.
- **Toggle concorrente / repetido**: a operação é idempotente — alternar para o mesmo valor não causa inconsistência.
- **Permissão de leitura sem escrita**: conteúdo visível, toggles desabilitados nos dois submódulos.
- **Rota antiga combinada** acessada por link salvo: redirecionar ou degradar de forma previsível (decisão no plano).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um submódulo "Estados" que lista todas as UFs com seu marcador de parceria (ligado/desligado).
- **FR-002**: No submódulo Estados, o usuário com permissão de escrita MUST poder alternar o marcador de cada UF, com atualização otimista e reversão em caso de erro.
- **FR-003**: O sistema MUST oferecer um submódulo "Municípios" com um seletor de Estado (UF); a lista de municípios só é exibida após uma UF ser escolhida.
- **FR-004**: No submódulo Municípios, após escolher uma UF, o sistema MUST listar os municípios daquela UF com seu marcador de parceria, e permitir alterná-lo (escrita), com atualização otimista e reversão em erro.
- **FR-005**: Ambos os submódulos MUST refletir o RBAC do servidor: exigir `geography:read` para visualizar e `geography:write` para alternar (toggles ocultos/desabilitados sem escrita).
- **FR-006**: O menu "Gestão de Parceiros" MUST apresentar dois subitens separados — "Estados" e "Municípios" — ambos visíveis apenas com `geography:read`, e MUST NOT mais apresentar o item único combinado anterior.
- **FR-007**: As operações de marcação MUST ser idempotentes (alternar para um valor já vigente não gera inconsistência).
- **FR-008**: Em qualquer falha do servidor, o sistema MUST exibir mensagem amigável e manter a interface consistente (reverter a ação otimista).
- **FR-009**: A funcionalidade MUST reaproveitar as operações de servidor existentes (listar estados, listar municípios por UF, alternar estado, alternar município) sem exigir mudança no core-api.

### Key Entities *(include if feature involves data)*

- **Estado (UF)**: unidade federativa, identificada por sigla/UF, com um marcador booleano de "é parceiro" (abrangência de parceria).
- **Município**: localidade pertencente a uma UF, com um marcador booleano de "é parceiro". É sempre consultado **no contexto de uma UF** (não há listagem global de municípios).
- **Marcação de parceria**: seleção territorial por toggle (não é CRUD) — liga/desliga a abrangência de um estado ou município.

## Impacto Arquitetural (core-api) *(obrigatório se a feature toca `src/`)*

> Feature **frontend-only**. Nenhuma mudança no core-api.

- **Bounded Contexts afetados**: [x] Parceiros (`partners`) — apenas camada de telas do client. Sem novo BC.
- **Novos agregados / Value Objects?**: Nenhum (servidor inalterado). No client, reusa os modelos de Estado/Município já existentes.
- **Novos eventos de domínio (outbox)?**: N/A (frontend; servidor inalterado).
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: Reusa as operações de geografia já existentes (4 server functions) e a permissão `geography:read`/`geography:write`. Sem novos endpoints no backend.
- **Possíveis violações da constituição?**: Nenhuma prevista — espelha o padrão das telas de parceiros, respeitando boundaries, erros-como-valor, design system só-tokens, i18n e views burras (MVVM).
- **Governança**: este redesenho **diverge da decisão documentada na 014** (tela combinada). Requer alinhamento com o tech lead antes da implementação (decisão de produto da stakeholder).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com permissão consegue alternar a marcação de parceria de um estado em menos de 5 segundos a partir do menu, com feedback imediato.
- **SC-002**: Um usuário consegue, no submódulo Municípios, escolher uma UF e alternar a marcação de um município em menos de 10 segundos.
- **SC-003**: 100% dos usuários com `geography:read` veem exatamente dois subitens ("Estados", "Municípios") e nenhum item combinado; usuários sem a permissão não veem nenhum dos dois.
- **SC-004**: 100% das ações de marcação ficam indisponíveis (desabilitadas) para usuários sem `geography:write`.
- **SC-005**: Em falha do servidor durante uma marcação, a interface reverte para o estado anterior em 100% dos casos (sem ficar "presa" no estado otimista).

## Assumptions

- O lado servidor de geografia (4 operações + permissão `geography:read`/`geography:write`) está estável e é suficiente — confirmado no código atual; nenhuma mudança no core-api é necessária.
- A listagem de municípios é **sempre por UF** (limitação do backend) — por isso o submódulo Municípios inclui um seletor de Estado; não há "listar todos os municípios".
- A rota/feature combinada anterior (014, seleção territorial em uma tela) é **substituída** pelos dois submódulos; o tratamento da rota antiga (redirect vs. remoção) é decidido no plano.
- O comportamento de toggle otimista e mensagens de erro segue o padrão já adotado na 014 e nas demais telas de parceiros.
- Esta mudança será **alinhada com o tech lead** (diverge da decisão da 014) antes de avançar para implementação.
