# Feature Specification: Anexo do documento assinado e efetivação do contrato

**Feature Branch**: `017-contract-document-activation`

**Created**: 2026-06-07

**Status**: Draft (revisado após correção da stakeholder)

**Input**: User description: "O ato de incluir ou não o documento assinado — que obriga a data de assinatura — dispara o evento de status do contrato e torna efetivo o registro. O sistema NÃO executa 'homologação'. Feature frontend-only no módulo `contracts`, reaproveitando o core-api existente."

## Contexto e Governança

Hoje o cadastro de contrato sempre grava o contrato como **Pendente** e nunca registra o documento assinado nem a data de assinatura — embora a tela de criação já tenha campos de anexo de PDF e de data de assinatura, eles são apenas visuais (nada é enviado). O backend (core-api) **já suporta** registrar o documento assinado e efetivar o contrato; falta apenas o frontend usar essas capacidades.

**Regra de negócio (corrigida pela stakeholder)**: o status do contrato é **consequência** de um único ato no registro — **incluir ou não o documento assinado**. O sistema **não executa nenhuma "homologação"**: incluir o documento (o que **obriga a data de assinatura**) **dispara o evento de status** do contrato, levando-o a **Em Andamento** e tornando o registro **efetivo**. Não incluir o documento mantém o contrato **Pendente**, aguardando que o documento seja incluído depois — quando incluído, o mesmo ato dispara o evento de status. A "homologação" de aditivos (amendments) é um conceito distinto do domínio e **está fora do escopo**; este fluxo não a executa.

Esta feature é uma **decisão da stakeholder** sobre uma funcionalidade que está pela metade no módulo de contratos e **deve ser alinhada com o tech lead** (cuja regra de negócio está correta e deve ser respeitada). O escopo é **somente frontend** (web-app v2): nenhum comportamento do core-api é criado ou alterado. Todas as mudanças são **aditivas** — o fluxo atual de criar um contrato Pendente, e os fluxos de edição e aditivos existentes, devem continuar funcionando sem regressão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar contrato sem documento → Pendente (Priority: P1)

Um usuário do setor de contratos cadastra um contrato cujo documento assinado **ainda não está disponível**. Ele preenche os dados obrigatórios, **não inclui** documento, e confirma. O contrato é registrado com status **Pendente** e aparece na grade, sinalizando que ainda aguarda o documento assinado para tornar-se efetivo.

**Why this priority**: É o comportamento mínimo e já esperado pela operação (e o único que existe hoje). Garante que o cadastro continua funcionando sem regressão e estabelece o estado inicial do ciclo de vida do contrato.

**Independent Test**: Criar um contrato preenchendo os campos obrigatórios e **sem** incluir documento; verificar que ele é salvo como Pendente e aparece na grade com esse status.

**Acceptance Scenarios**:

1. **Given** um usuário com permissão de escrita na tela de criação de contrato, **When** ele preenche os dados obrigatórios, não inclui documento e confirma, **Then** o contrato é criado com status **Pendente** e o usuário é redirecionado para a grade, onde o contrato aparece como Pendente.
2. **Given** a tela de finalização aberta sem documento incluído, **When** o usuário visualiza o resumo, **Then** o status previsto exibido é **Pendente** (coerente com o que será efetivamente gravado).

---

### User Story 2 - Incluir o documento assinado já na criação → contrato efetivo (Em Andamento) (Priority: P1)

Quando o documento assinado já está disponível no momento do cadastro, o usuário o inclui no modal de finalização e informa a **data de assinatura** (obrigatória ao incluir o documento). Ao confirmar, a inclusão do documento **dispara o evento de status** e o contrato é registrado já **efetivo**, como **Em Andamento**, com o documento associado.

**Why this priority**: É o caminho que materializa a regra corrigida — a inclusão do documento (com data de assinatura) é o que torna o registro efetivo. Sem isso, nenhum contrato sai de Pendente.

**Independent Test**: Criar um contrato incluindo um PDF assinado válido + data de assinatura no modal; verificar que o contrato nasce **Em Andamento** com o documento associado.

**Acceptance Scenarios**:

1. **Given** a tela de criação com documento incluído e data de assinatura informada, **When** o usuário confirma, **Then** o contrato é registrado e fica **Em Andamento** (efetivo), com o documento associado.
2. **Given** documento incluído **sem** data de assinatura informada, **When** o usuário tenta confirmar, **Then** o sistema **exige** a data de assinatura antes de prosseguir.
3. **Given** a confirmação com documento, mas a etapa de registro do documento/efetivação **falha** após o contrato já ter sido criado, **When** o erro ocorre, **Then** o contrato permanece registrado como **Pendente**, o usuário é informado do que falhou e orientado a incluir o documento depois (US3), sem perder o contrato criado.

---

### User Story 3 - Incluir o documento assinado depois, num contrato Pendente → efetiva (Em Andamento) (Priority: P1)

Para um contrato que está **Pendente**, o usuário recebe o documento assinado e precisa incluí-lo. A partir da grade ou do detalhe do contrato, ele aciona "incluir documento assinado", seleciona o PDF, informa a **data de assinatura** e confirma. A inclusão do documento **dispara o evento de status** e o contrato passa para **Em Andamento** (efetivo), com a mudança visível imediatamente. É **o mesmo ato** da US2, apenas realizado após o registro inicial — **não é uma "homologação"** executada pelo sistema.

**Why this priority**: Completa a regra: um contrato registrado sem documento não pode ficar preso em Pendente para sempre. É P1 porque, junto com a US1, forma o ciclo de vida mínimo (Pendente → efetivo) que a operação precisa.

**Independent Test**: Partindo de um contrato Pendente, incluir um PDF assinado válido com data de assinatura; verificar que o contrato passa a **Em Andamento** e que o documento fica associado a ele.

**Acceptance Scenarios**:

1. **Given** um contrato com status **Pendente** e um usuário com permissão de escrita, **When** o usuário inclui um PDF assinado válido e informa a data de assinatura, **Then** o documento é registrado e o status muda para **Em Andamento** (efetivo).
2. **Given** o mesmo cenário, **When** a operação é concluída, **Then** a grade/detalhe refletem o novo status **Em Andamento** sem necessidade de recarregar a página manualmente.
3. **Given** um contrato que **não está Pendente** (ex.: já Em Andamento), **When** o usuário visualiza as ações disponíveis, **Then** a ação de "incluir documento assinado" não é oferecida (ou é claramente indisponível).
4. **Given** um usuário **sem** permissão de escrita, **When** ele visualiza um contrato Pendente, **Then** a ação de incluir documento não é exibida.

---

### Edge Cases

- **Arquivo não-PDF ou corrompido**: o sistema rejeita arquivos que não sejam PDF assinado válido (verificação de tipo real, não só extensão) e informa o usuário, sem alterar o status do contrato.
- **Arquivo acima do limite de tamanho**: arquivos maiores que o limite permitido (20 MB) são rejeitados com mensagem clara antes do envio.
- **Data de assinatura ausente ou inválida** (ex.: futura): bloquear a confirmação com mensagem clara — a data é obrigatória sempre que o documento é incluído.
- **Documento já existente / já substituído / já removido**: se o backend indicar que o documento já foi incluído, substituído ou removido, a UI traduz o erro em mensagem compreensível e mantém o estado consistente (sem ação dupla).
- **Documento de outro contrato**: caso o vínculo documento↔contrato não confira, a operação é recusada com mensagem clara.
- **Falha parcial na criação com documento (US2)**: contrato criado mas registro do documento/efetivação falha → contrato fica Pendente e recuperável via US3 (ver AS-3 da US2).
- **Perda de sessão durante a operação**: o usuário é levado ao login e nenhuma alteração silenciosa é aplicada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST registrar um contrato com status **Pendente** quando nenhum documento assinado é incluído no momento da criação (comportamento atual preservado, sem regressão).
- **FR-002**: O sistema MUST exigir a **data de assinatura** sempre que um documento assinado for incluído (na criação ou posteriormente); sem a data, a confirmação é bloqueada.
- **FR-003**: O sistema MUST tratar a **inclusão do documento assinado** (com a data de assinatura) como o ato que **dispara o evento de status** do contrato, levando-o a **Em Andamento** e tornando o registro efetivo.
- **FR-004**: O sistema MUST permitir incluir o documento assinado **na criação** do contrato; ao confirmar com documento + data, o contrato resulta **Em Andamento** (efetivo).
- **FR-005**: O sistema MUST permitir incluir o documento assinado **posteriormente** num contrato **Pendente** (a partir da grade e/ou do detalhe), resultando na transição para **Em Andamento** (efetivo) — sem que isso seja uma operação de "homologação" executada pelo sistema.
- **FR-006**: O sistema MUST validar, antes do envio, que o arquivo é um PDF assinado válido (tipo real de arquivo) e que respeita o limite de tamanho (20 MB), rejeitando o que não atender com mensagem clara.
- **FR-007**: O sistema MUST NOT executar nenhuma operação de "homologação" como parte deste fluxo; a transição de status é exclusivamente consequência da inclusão do documento. (A homologação de aditivos/amendments é um fluxo distinto e fora de escopo.)
- **FR-008**: O sistema MUST oferecer as ações de incluir documento **apenas** para usuários com permissão de escrita em contratos; usuários sem permissão não veem essas ações.
- **FR-009**: O sistema MUST oferecer a ação de incluir documento posteriormente **apenas** para contratos em status **Pendente**; contratos em outros status não oferecem a ação.
- **FR-010**: O sistema MUST refletir o novo status (**Em Andamento**) e a presença do documento na grade e no detalhe imediatamente após a operação, sem recarga manual da página.
- **FR-011**: O sistema MUST traduzir as condições de erro do registro de documento (tipo inválido, vínculo incorreto, documento já incluído/substituído/removido, documento ausente) em mensagens compreensíveis ao usuário, mantendo o estado consistente.
- **FR-012**: Em caso de falha no registro do documento/efetivação **após** o contrato já ter sido criado (inclusão na criação), o sistema MUST preservar o contrato como **Pendente**, informar a falha e permitir incluir o documento depois.
- **FR-013**: O sistema MUST manter os fluxos existentes de criação, edição e aditivos de contrato funcionando sem alteração de comportamento (mudanças aditivas).

### Key Entities *(include if feature involves data)*

- **Contrato**: acordo registrado no módulo de contratos. Atributo central para esta feature: **status** (Pendente → Em Andamento), cuja transição é disparada pela inclusão do documento assinado.
- **Documento assinado do contrato**: o PDF assinado associado a um contrato, com metadados (**data de assinatura**, data de inclusão). É o ato de incluí-lo que torna o contrato efetivo. Um contrato Pendente possui zero documentos; após incluir, possui o documento associado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue tornar um contrato **Pendente** efetivo (**Em Andamento**) incluindo o documento assinado em menos de 1 minuto, sem ajuda técnica.
- **SC-002**: 100% dos contratos com documento assinado incluído com sucesso ficam **Em Andamento**; 100% dos contratos sem documento permanecem **Pendente**.
- **SC-003**: 100% das tentativas de incluir arquivo inválido (não-PDF, acima do limite, sem data de assinatura) são bloqueadas com mensagem compreensível, sem alterar o status do contrato.
- **SC-004**: Nenhuma regressão nos fluxos existentes de contratos (criar Pendente, editar, aditivos) — verificável pelo gate de qualidade do projeto permanecer verde (baseline de testes preservado).
- **SC-005**: Após a operação, o status correto aparece para o usuário sem que ele precise recarregar a página manualmente.

## Impacto Arquitetural (core-api) *(obrigatório se a feature toca `src/`)*

- **Bounded Contexts afetados**: [x] Contratos (`ctr_*`) · [ ] Financeiro · [ ] Auth · [ ] Parceiros
  - Observação: a feature **lê/usa** capacidades do BC de Contratos do core-api, mas **não altera** o core-api. Toca apenas a camada client + BFF (server functions) da web-app.
- **Novos agregados / Value Objects?**: Nenhum no core-api. No frontend, pode haver value-objects de borda (validação de PDF/tamanho/data de assinatura) seguindo smart constructors com `Result<T,E>` — detalhe no plano.
- **Novos eventos de domínio (outbox)?**: Nenhum criado no core-api. O "evento de status" referido na regra é o efeito já existente no core-api ao registrar o documento/efetivar; o frontend apenas o aciona.
- **Novos subcomandos de CLI?**: Não.
- **Borda HTTP envolvida?**: Apenas **consumo** de rotas já existentes do core-api via as server functions (BFF) da web-app; nenhuma rota nova no core-api.
- **Possíveis violações da constituição (I–VIII)?**: Nenhuma prevista. Mudanças aditivas, respeitando Result, imutabilidade, design system só-tokens, i18n, views burras (MVVM) e fronteiras por public-api.

## Assumptions

- **Backend pronto e reutilizado sem mudança**: o core-api já oferece registrar o documento assinado de um contrato e efetivá-lo (transição de status disparada por esse ato), com os respectivos erros de validação. Esta feature apenas os consome.
- **Sem "homologação" executada pelo sistema**: a transição Pendente → Em Andamento é consequência da inclusão do documento assinado, não de uma operação de homologação. A homologação de **aditivos/amendments** é um fluxo distinto e está **fora do escopo**.
- **Data de assinatura obrigatória ao incluir o documento**; não pode ser futura (assinatura é fato passado).
- **Formato do documento**: PDF assinado, até 20 MB; um documento principal por contrato para fins desta feature.
- **Permissão**: as ações de incluir documento usam a permissão de **escrita em contratos** já existente; não há permissão nova.
- **Pontos de entrada**: criação (modal de finalização) e contrato Pendente já existente (via grade e/ou detalhe).
- **Sem regressão**: o fluxo de criar Pendente e os demais fluxos do módulo permanecem intactos; todas as mudanças são aditivas.
- **Alinhamento com o tech lead**: a regra de negócio dele está correta e é respeitada; a implementação será revisada/alinhada com ele.
