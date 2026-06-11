# Feature Specification: ACT reescrito — Acordo de Cooperação Técnica (instituição/CNPJ)

**Feature Branch**: `022-act-acordo`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "ACT reescrito: pessoa-física → Acordo de Cooperação Técnica (instituição/CNPJ) no front (web-app v2) — §1.1 do handoff #32. Frontend-only, módulo partners (recurso ACT), sem tocar core-api."

## Resumo

O recurso **ACT** (`/api/v1/acts`) foi **totalmente reescrito** no backend (#32): deixou de ser uma **pessoa-física** (espelho de Colaborador, com CPF/cargo/vínculo) e passou a ser um **Acordo de Cooperação Técnica firmado com uma instituição parceira (CNPJ)**. O **frontend ainda usa o modelo antigo** — por isso **cadastrar e editar um ACT hoje quebra** (o front envia `cpf`/`role`/`startOfContract` para um backend que espera `cnpj`/razão social/vigência/etc.). Esta feature alinha o front ao novo Acordo: **cadastrar, editar, listar (com filtros) e ver o detalhe** de um Acordo passam a funcionar com os campos institucionais novos, com validação na borda e mensagens amigáveis. É **frontend-only** e não deve regredir os demais parceiros (colaborador/fornecedor/financiador). Referência de UI: o módulo **Fornecedor** já tem o mesmo "miolo" (CNPJ, razão social, nome fantasia, dados bancários/PIX) e serve de molde.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar um Acordo (Priority: P1)

Como gestora de parceiros, quero **cadastrar um Acordo de Cooperação Técnica** informando os dados da instituição (CNPJ, razão social, nome fantasia), o número do instrumento, a área de atuação, o representante legal, a vigência (início e fim) e, quando houver repasse financeiro, os dados de conta bancária e/ou PIX — para registrar o acordo e poder usá-lo nos contratos.

**Why this priority**: É o fluxo **hoje quebrado** e o objetivo central — sem ele, não se cadastra Acordo pela UI. Os demais (editar/listar/detalhe) dependem do mesmo modelo de dados.

**Independent Test**: Preencher o formulário de novo Acordo com dados válidos (com e sem repasse financeiro) e confirmar que o Acordo é criado e aparece na listagem/detalhe.

**Acceptance Scenarios**:

1. **Given** o formulário de novo Acordo, **When** preencho número do instrumento, objeto, e-mail, CNPJ, razão social, nome fantasia, área de atuação, representante legal e vigência (fim ≥ início) **sem** repasse financeiro, **Then** o Acordo é criado e fica visível na listagem e no detalhe.
2. **Given** o formulário com **repasse financeiro ativado**, **When** informo **ao menos** conta bancária **ou** chave PIX, **Then** o Acordo é criado com os dados de repasse.
3. **Given** o formulário com **repasse financeiro ativado** e **sem** conta nem PIX, **Then** o sistema **impede** a conclusão e exibe mensagem clara de que é preciso informar conta ou PIX.
4. **Given** o formulário, **When** informo um **CNPJ inválido**, **Then** o sistema exibe mensagem amigável de CNPJ inválido (sem detalhe técnico).
5. **Given** o formulário, **When** a **data de fim não é posterior à de início** (igual ou anterior), **Then** o sistema impede a conclusão com mensagem clara.
6. **Given** um **número de instrumento já usado** por outro Acordo, **When** concluo, **Then** o sistema exibe mensagem amigável de número duplicado, mantendo a usuária na tela.

---

### User Story 2 - Editar um Acordo (Priority: P1)

Como gestora, quero **editar um Acordo** existente (mesmos campos do cadastro) para corrigir/atualizar os dados.

**Why this priority**: A edição compartilha o mesmo modelo do cadastro; sem ela, atualizar um Acordo (que hoje também quebra) fica impossível.

**Independent Test**: Abrir um Acordo existente em edição, alterar campos (incluindo ligar/desligar o repasse financeiro) e salvar; confirmar a persistência no detalhe.

**Acceptance Scenarios**:

1. **Given** um Acordo existente, **When** abro a edição, **Then** os campos vêm pré-preenchidos com os dados atuais (incluindo conta/PIX quando houver).
2. **Given** a edição, **When** altero campos válidos e salvo, **Then** as mudanças são refletidas no detalhe.
3. **Given** a edição com repasse ativado e sem conta/PIX, **When** salvo, **Then** é bloqueado com a mesma mensagem do cadastro.

---

### User Story 3 - Listar e filtrar Acordos + ver detalhe (Priority: P2)

Como gestora, quero **listar os Acordos** com busca e filtros (ativo/inativo, com/sem repasse financeiro, área de atuação) e **abrir o detalhe** de cada um, para encontrar e consultar acordos.

**Why this priority**: Leitura/descoberta; depende do modelo novo estar mapeado, mas é secundária ao cadastro/edição.

**Acceptance Scenarios**:

1. **Given** a lista de Acordos, **When** aplico busca e/ou filtros (ativo, repasse financeiro, área), **Then** a lista reflete os critérios.
2. **Given** a lista, **When** abro um Acordo, **Then** o detalhe mostra os campos do Acordo (instituição, vigência, área, representante, repasse com conta/PIX quando houver, situação ativo/inativo).
3. **Given** um Acordo no detalhe, **When** o desativo/reativo, **Then** a situação muda (como nos demais parceiros).

---

### Edge Cases

- **Conceitos de pessoa-física removidos**: a UI **não** deve mais exibir/coletar CPF, cargo, data de início de contrato, vínculo empregatício, "status de cadastro" nem o passo de "completar cadastro" — esses conceitos não existem mais para Acordo.
- **Repasse desligado**: conta e PIX ficam ocultos/limpos; nenhum é exigido.
- **Vigência**: a data de fim deve ser **posterior** à de início — fim **igual** ou **anterior** ao início é inválido (o backend recusa vigência de duração zero).
- **Falha do backend**: erros (número duplicado, CNPJ inválido, vigência inválida, repasse sem destino) viram **mensagens amigáveis** sem detalhe técnico, mantendo a usuária na tela.
- **Sem regressão**: colaborador/fornecedor/financiador, grid de contratos e demais telas continuam funcionando.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A usuária MUST poder **cadastrar** um Acordo informando: número do instrumento, objeto/nome, e-mail, CNPJ, razão social, nome fantasia, área de atuação, representante legal, vigência (início e fim) e indicador de repasse financeiro.
- **FR-002**: Quando o **repasse financeiro** estiver ativado, o app MUST exigir **ao menos** conta bancária **ou** chave PIX; ausente → impedir conclusão com mensagem clara (espelha a regra do backend).
- **FR-003**: O app MUST validar na borda o **CNPJ** e a **vigência** (fim ≥ início) e exibir mensagens amigáveis quando inválidos.
- **FR-004**: O app MUST tratar **número de instrumento duplicado** com mensagem amigável (sem expor detalhe técnico), mantendo a usuária na tela.
- **FR-005**: A usuária MUST poder **editar** um Acordo com os mesmos campos e regras do cadastro, com os valores atuais pré-carregados.
- **FR-006**: A usuária MUST poder **listar** Acordos com **busca** e **filtros** por situação (ativo/inativo), repasse financeiro (com/sem) e área de atuação; e **abrir o detalhe**.
- **FR-007**: O **detalhe** MUST exibir os campos do Acordo (instituição/CNPJ/razão social/fantasia, área, representante legal, vigência, repasse com conta/PIX quando houver, situação ativo/inativo).
- **FR-008**: A usuária MUST poder **desativar/reativar** um Acordo (como nos demais parceiros).
- **FR-009**: O app MUST **remover** da UI os conceitos de pessoa-física (CPF, cargo, data de início de contrato, vínculo, status de cadastro, completar cadastro) do recurso ACT.
- **FR-010**: A feature MUST ser **frontend-only** e **não regredir** os demais parceiros (colaborador/fornecedor/financiador) nem outras telas.

### Key Entities *(include if feature involves data)*

- **Acordo de Cooperação Técnica (ACT)**: instrumento firmado com uma instituição parceira. Atributos: **número do instrumento** (único), **objeto/nome**, **e-mail**, **CNPJ**, **razão social**, **nome fantasia/sigla**, **área de atuação** (PARC/DDI/DCE/EPV), **representante legal**, **vigência** (data de início e fim), **indicador de repasse financeiro** e, quando houver repasse, **conta bancária** e/ou **chave PIX**. Metadados: situação (ativo/inativo), datas de criação/atualização.
- **Destino de repasse**: conta bancária (banco, agência, conta, dígito) e/ou chave PIX (tipo + chave) — exigidos só quando há repasse financeiro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cadastros de Acordo com dados válidos (com e sem repasse) são **criados com sucesso** pela UI — o fluxo hoje quebrado volta a funcionar.
- **SC-002**: Tentativas inválidas (repasse sem conta/PIX, CNPJ inválido, vigência fim<início, número duplicado) são **bloqueadas com mensagem clara** em 100% dos casos, sem quebrar a tela.
- **SC-003**: Editar, listar (com filtros) e ver o detalhe de um Acordo refletem os campos novos corretamente.
- **SC-004**: **Zero menções** a CPF/cargo/vínculo/status-de-cadastro no recurso ACT após a mudança.
- **SC-005**: **Zero regressões** em colaborador/fornecedor/financiador e demais telas — verificado por `pnpm verify` + `pnpm test:dom` e checagem em tela.

## Impacto Arquitetural *(frontend — web-app v2)*

> Spec do repositório **web-app v2 (frontend)**. A seção do template voltada ao core-api é **N/A**.

- **Toca core-api?** **Não.** Frontend-only; consome o recurso `/api/v1/acts` já reescrito no #32.
- **Módulo afetado**: `src/modules/partners/` (recurso **ACT**: server domain/application/adapters + client data/view-model/ui — list/create/edit/detail). Os demais recursos do módulo não mudam.
- **Fronteira client↔server**: server functions (única fronteira); validação Zod na borda (input da server fn + response do core-api).
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; design system **só-tokens**; strings de UI = **tags i18n**; **views burras** (sem `useQuery`/`useMutation` em page/component); boundaries por `public-api`; naming por postfix.
- **Risco principal**: é uma **reescrita ampla** do recurso ACT (vários arquivos, 4 fluxos) — o risco é regredir os outros parceiros ou deixar resquício do modelo antigo. Mitiga-se espelhando o módulo Fornecedor e cobrindo mapeadores/validação com testes.

## Assumptions

- O backend do **#32** (já no `dev`) é a referência (handoff §2.6.4): body do Acordo com `actNumber`/`name`/`email`/`cnpj`/`corporateName`/`fantasyName`/`occupationArea`/`legalRepresentative`/`startDate`/`endDate`/`hasFinancialTransfer`/`bankAccount`/`pixKey`; regra de repasse (true ⇒ conta ou PIX, senão 422 `act-payment-target-required`); CNPJ inválido (`invalid-cnpj`) → 422; vigência inválida (`period-end-before-start`/`period-zero-duration`, i.e. fim deve ser > início) → 422; `actNumber` duplicado (`register-act-number-duplicate`/`edit-act-number-duplicate`) → 409; criação responde 201 + Location; lista com filtros `search/active/hasFinancialTransfer/occupationArea` e paginação harmonizada; deactivate/reactivate como nos demais.
- A **UI do Fornecedor** (CNPJ/razão social/fantasia/conta/PIX) é o molde do form do Acordo (sem `serviceRating`, que é da fatia §1.6).
- As **áreas de atuação** são `PARC|DDI|DCE|EPV` (rótulos legíveis na UI).
- **Fora de escopo**: avaliação de fornecedor (§1.6), cancelamento de contrato (§1.7), municípios parceiros cross-state (§1.8), qualquer mudança no core-api, e os demais parceiros (que não devem regredir).
