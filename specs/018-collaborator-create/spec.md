# Feature Specification: Inclusão de Colaborador (Novo Colaborador)

**Feature Branch**: `018-collaborator-create`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Submódulo Colaboradores não tem botão de Novo, para a inclusão de um novo colaborador."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar um novo colaborador (Priority: P1)

Um operador autorizado abre a listagem de Colaboradores, clica em **Novo**, preenche o formulário
(nome, e-mail, CPF, área de atuação, cargo, início do contrato, vínculo empregatício) e salva. O
colaborador passa a aparecer na listagem.

**Why this priority**: É a razão da feature — hoje não há como incluir colaborador pela UI (só
Fornecedores/Financiadores/ACT têm o fluxo). Sem isso, o submódulo fica incompleto.

**Independent Test**: Com permissão `collaborator:write`, criar um colaborador válido e confirmar que ele
aparece na listagem (e que a navegação volta para a lista após salvar).

**Acceptance Scenarios**:

1. **Given** o operador com permissão na listagem de Colaboradores, **When** clica em "Novo", **Then** é levado à tela de inclusão com o formulário vazio.
2. **Given** o formulário preenchido com dados válidos, **When** clica em salvar, **Then** o colaborador é criado, a navegação volta à listagem e a lista reflete o novo registro.
3. **Given** o formulário com dado inválido (ex.: e-mail malformado, CPF curto, campo obrigatório vazio), **When** tenta salvar, **Then** o sistema impede o envio e exibe a mensagem do(s) campo(s) com problema, sem sair da tela.

---

### User Story 2 - Botão "Novo" condicionado à permissão (Priority: P2)

O botão **Novo** só aparece para quem tem permissão de escrita de colaborador.

**Why this priority**: Consistência com os demais submódulos (RBAC) e segurança — quem não pode criar não vê a ação.

**Independent Test**: Usuário sem `collaborator:write` não vê o botão "Novo"; com a permissão, vê.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão de escrita, **When** abre a listagem, **Then** o botão "Novo" não é exibido.
2. **Given** um usuário com `collaborator:write`, **When** abre a listagem, **Then** o botão "Novo" é exibido.

---

### User Story 3 - Feedback de erro do servidor (Priority: P3)

Se a criação falhar no servidor (ex.: e-mail/CPF já cadastrado, indisponibilidade), o operador recebe uma
mensagem clara e permanece na tela com os dados preenchidos.

**Why this priority**: Evita perda de dados e confusão; reaproveita o tratamento de erro já usado nos outros submódulos.

**Acceptance Scenarios**:

1. **Given** dados que o servidor rejeita (ex.: duplicidade), **When** salva, **Then** uma mensagem de erro legível é exibida e o formulário permanece preenchido.

### Edge Cases

- Campos obrigatórios vazios → salvar fica bloqueado / mostra erro de validação.
- E-mail malformado ou CPF com menos de 11 dígitos → erro de validação na borda, sem chamada ao servidor.
- Falha de conectividade → mensagem de erro amigável; nada é perdido.
- Usuário sem permissão tenta acessar a rota direta `/parceiros/colaboradores/criar` → tratamento consistente com os demais submódulos (sem ação de escrita).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A listagem de Colaboradores MUST exibir um botão "Novo" que leva à tela de inclusão.
- **FR-002**: O botão "Novo" MUST ser visível apenas para usuários com permissão `collaborator:write`.
- **FR-003**: A tela de inclusão MUST capturar: nome, e-mail, CPF, área de atuação, cargo, início do contrato e vínculo empregatício.
- **FR-004**: O sistema MUST validar os campos na borda (obrigatoriedade, formato de e-mail, tamanho de CPF, área/vínculo dentro dos valores permitidos) antes de enviar.
- **FR-005**: Ao salvar com sucesso, o sistema MUST registrar o colaborador, voltar para a listagem e refletir o novo registro na lista.
- **FR-006**: Em erro (validação ou servidor), o sistema MUST exibir mensagem legível e manter o usuário na tela com os dados preenchidos.
- **FR-007**: A feature MUST ser aditiva — não pode quebrar a listagem de Colaboradores nem os demais submódulos de Parceiros.

### Key Entities *(include if feature involves data)*

- **Colaborador**: pessoa vinculada à organização. Atributos do cadastro: nome, e-mail, CPF, área de atuação (enum), cargo, data de início do contrato, vínculo empregatício (enum). (Já modelado no domínio existente — `CreateCollaboratorInput`.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador com permissão consegue criar um colaborador válido e vê-lo na listagem em menos de 1 minuto.
- **SC-002**: 100% dos campos inválidos são barrados na borda (sem chamada ao servidor) com mensagem clara.
- **SC-003**: Usuários sem `collaborator:write` nunca veem o botão "Novo".
- **SC-004**: Nenhuma regressão na listagem de Colaboradores nem nos demais submódulos (gate verde: typecheck + lint + testes).

## Impacto Arquitetural

> **Feature FRONTEND-ONLY (web-app v2).** Não toca o `core-api`.

- **Bounded Contexts afetados**: Parceiros (apenas a camada **client** do módulo `partners`). Backend/BFF de criação de colaborador **já existe** (server-fn `create-collaborator`, `collaboratorRepository.create`).
- **Novos agregados / Value Objects?**: Nenhum (reusa `CreateCollaboratorInput` do domínio).
- **Novos eventos de domínio (outbox)?**: N/A (frontend).
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: N/A no core-api (a fronteira client↔server é a server function já existente).
- **Possíveis violações da constituição?**: Nenhuma prevista — espelha `supplier-create`, respeita MVVM/views burras, Result, só-tokens, i18n, boundaries.

## Assumptions

- O backend/BFF de criação de colaborador está pronto e correto (verificado no código: server-fn + repository).
- O formulário espelha o padrão de `supplier-create` (layout, validação na borda, navegação pós-sucesso).
- Os enums de área de atuação e vínculo empregatício já existem no domínio e têm tags i18n (ou serão adicionadas).
- Detail e edit de colaborador estão FORA do escopo desta feature (só CREATE).
- Importação em lote permanece via o fluxo existente (`importCollaborators`), fora do escopo.
