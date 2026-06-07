# Feature Specification: Telas de Financiadores (partners)

**Feature Branch**: `012-financier-screens`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Telas de Financiadores (financier) no módulo partners — espelhando o molde já consolidado de Fornecedores (feature 010). O server-side já está pronto; esta feature entrega apenas o client/ (telas) + a entrada de menu."

## Clarifications

### Session 2026-06-07

Dois pontos resolvidos por **consistência com o molde 010** (não exigiram decisão de produto):

- Q: Após salvar, para onde o usuário navega? → A: **Criar → listagem** (`/parceiros/financiadores`); **editar → detalhe** (`/parceiros/financiadores/$id`) — idêntico ao supplier.
- Q: O slug `financier:edit-sensitive` governa o quê nas telas? → A: **Nada.** O financiador não tem campos sensíveis (sem pagamento/PIX/CPF); todos os 6 campos são comuns. Diferente do supplier, `edit-sensitive` **não** condiciona nenhum campo/ação aqui — apenas `financier:read` (ver) e `financier:write` (criar/editar/status) se aplicam.

## User Scenarios & Testing *(mandatory)*

> Mesmo molde da feature 010 (fornecedores). Um **financiador** é um parceiro **pessoa jurídica
> (PJ-only)**: razão social, representante legal, CNPJ, telefone e endereço. Difere do fornecedor
> por **não** ter categorias de serviço nem dados de pagamento/PIX.

### User Story 1 - Listar financiadores (Priority: P1)

Um usuário com permissão de leitura de financiadores acessa "Financiadores" no menu e vê uma
**lista paginada** com busca por nome, filtro por status (ativo/inativo) e ordenação. Cada linha
mostra nome, razão social, CNPJ, telefone e status. Há um botão "Novo financiador" (visível
apenas para quem pode criar).

**Why this priority**: É a porta de entrada do módulo e o MVP — sem a listagem não há navegação
para detalhe/edição. Entrega valor sozinha (consultar a base de financiadores).

**Independent Test**: Acessar a rota de listagem com um usuário com `financier:read`, ver a tabela
povoada, buscar por nome, alternar o filtro de status e paginar — tudo refletindo os dados reais.

**Acceptance Scenarios**:

1. **Given** um usuário com `financier:read`, **When** abre a listagem, **Then** vê a tabela com nome, razão social, CNPJ, telefone e status, paginada (5 por página por padrão).
2. **Given** a listagem aberta, **When** digita um termo de busca, **Then** a lista passa a mostrar apenas financiadores cujo nome casa com o termo.
3. **Given** a listagem aberta, **When** filtra por "ativos" (ou "inativos"), **Then** a lista mostra apenas financiadores naquele status.
4. **Given** mais resultados que o tamanho da página, **When** avança a paginação, **Then** vê a próxima página sem perder o filtro/busca aplicados.
5. **Given** um usuário **sem** `financier:write`, **When** abre a listagem, **Then** o botão "Novo financiador" não é exibido (ou fica desabilitado).
6. **Given** uma falha ao carregar, **When** a lista não pode ser obtida, **Then** vê uma mensagem de erro amigável (não um código técnico).

---

### User Story 2 - Cadastrar financiador (Priority: P1)

Um usuário com permissão de escrita cria um novo financiador preenchendo o formulário PJ-only
com os 6 campos obrigatórios: nome, razão social, representante legal, CNPJ, telefone e endereço.
Ao salvar, o financiador passa a aparecer na listagem.

**Why this priority**: Sem cadastro a base nunca cresce; é a segunda capacidade essencial.

**Independent Test**: Com um usuário com `financier:write`, abrir o formulário, preencher os 6
campos válidos, salvar e confirmar que o novo financiador aparece na listagem.

**Acceptance Scenarios**:

1. **Given** um usuário com `financier:write`, **When** abre "Novo financiador", **Then** vê um formulário com os 6 campos obrigatórios (nome, razão social, representante legal, CNPJ, telefone, endereço).
2. **Given** o formulário preenchido com dados válidos, **When** salva, **Then** o financiador é criado e o usuário é levado de volta à **listagem** com o novo registro presente.
3. **Given** um CNPJ digitado com máscara, **When** salva, **Then** o sistema aceita o valor (a máscara não impede o cadastro).
4. **Given** um campo obrigatório vazio ou inválido, **When** tenta salvar, **Then** vê a validação no campo e o envio é bloqueado.
5. **Given** o backend rejeita o cadastro (ex.: CNPJ duplicado), **When** salva, **Then** vê uma mensagem de erro amigável e permanece no formulário com os dados.

---

### User Story 3 - Detalhar e alternar status (Priority: P2)

Um usuário abre o detalhe de um financiador e vê todos os seus dados (incluindo representante
legal e endereço). Com permissão de escrita, pode **desativar** um financiador ativo ou
**reativar** um inativo.

**Why this priority**: Visualização completa + ciclo de vida (ativar/desativar) consolidam a gestão;
dependem da listagem (US1) já existir para navegação.

**Independent Test**: Abrir o detalhe de um financiador existente, conferir todos os campos e,
com `financier:write`, desativar/reativar e ver o status mudar.

**Acceptance Scenarios**:

1. **Given** um financiador existente, **When** abre seu detalhe, **Then** vê todos os campos, incluindo representante legal e endereço, além do status atual.
2. **Given** um financiador **ativo** e um usuário com `financier:write`, **When** desativa, **Then** o status passa a "inativo" e a mudança é refletida na tela.
3. **Given** um financiador **inativo** e um usuário com `financier:write`, **When** reativa, **Then** o status passa a "ativo".
4. **Given** um usuário **sem** `financier:write`, **When** abre o detalhe, **Then** as ações de ativar/desativar não são exibidas (ou ficam desabilitadas).
5. **Given** uma falha na ação de status, **When** tenta alternar, **Then** vê uma mensagem de erro amigável e o status anterior é mantido.

---

### User Story 4 - Editar financiador (Priority: P2)

Um usuário com permissão de escrita edita um financiador existente reaproveitando o mesmo
formulário do cadastro, já preenchido com os valores atuais. Ao salvar, todos os campos são
atualizados.

**Why this priority**: Completa o CRUD; depende do formulário da US2 e da navegação da US1/US3.

**Independent Test**: Abrir a edição de um financiador, alterar um campo, salvar e confirmar a
mudança no detalhe e na listagem.

**Acceptance Scenarios**:

1. **Given** um financiador existente e um usuário com `financier:write`, **When** abre a edição, **Then** vê o formulário pré-preenchido com os valores atuais.
2. **Given** o formulário de edição, **When** altera campos válidos e salva, **Then** os dados são atualizados e refletidos no detalhe/listagem.
3. **Given** um campo obrigatório esvaziado, **When** tenta salvar, **Then** vê a validação e o envio é bloqueado.
4. **Given** um usuário **sem** `financier:write`, **When** tenta acessar a edição, **Then** não consegue salvar alterações (ação indisponível).

---

### Edge Cases

- **Sem permissão de leitura**: usuário sem `financier:read` não vê o subitem "Financiadores" no
  menu nem acessa as telas (consistente com o RBAC de menu da feature 011).
- **Lista vazia**: quando não há financiadores (ou o filtro não retorna nada), a listagem mostra
  um estado vazio claro, não um erro.
- **Permissões degradadas (`[]`)**: na ausência de permissões, as ações de escrita ficam ocultas
  e o acesso de leitura segue a política de menu (lado seguro).
- **CNPJ com máscara vs sem máscara**: ambos os formatos de entrada levam ao mesmo cadastro.
- **Busca + filtro + paginação combinados**: aplicar busca e filtro juntos e paginar não deve
  perder nenhum dos critérios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST listar financiadores de forma paginada, com busca por nome, filtro por status (ativo/inativo) e ordenação (ascendente/descendente).
- **FR-002**: A listagem MUST exibir, por financiador: nome, razão social, CNPJ, telefone e status.
- **FR-003**: O sistema MUST permitir criar um financiador com os 6 campos obrigatórios (nome, razão social, representante legal, CNPJ, telefone, endereço), aceitando CNPJ com ou sem máscara.
- **FR-004**: O sistema MUST exibir o detalhe de um financiador com todos os seus campos, incluindo representante legal e endereço.
- **FR-005**: O sistema MUST permitir desativar um financiador ativo e reativar um inativo.
- **FR-006**: O sistema MUST permitir editar um financiador, atualizando todos os campos (substituição total).
- **FR-007**: O sistema MUST aplicar RBAC: leitura (`financier:read`) controla acesso de visualização; escrita (`financier:write`) controla criar/editar/ativar/desativar; ações sem permissão ficam ocultas ou desabilitadas.
- **FR-008**: O sistema MUST exibir o subitem "Financiadores" no menu, sob "Gestão de Parceiros", visível apenas para quem possui `financier:read`.
- **FR-009**: O sistema MUST traduzir qualquer falha de backend em mensagem amigável (nunca expor código/status técnico ao usuário).
- **FR-010**: Toda string visível MUST vir do catálogo de internacionalização (`partners.financiers.*`), sem literais cravados na tela.
- **FR-011**: As validações de campo obrigatório/limite MUST bloquear o envio e sinalizar o campo afetado antes de chamar o backend.

### Key Entities *(include if feature involves data)*

- **Financiador (Financier)**: parceiro PJ. Campos: nome, razão social, representante legal, CNPJ,
  telefone, endereço, e status de ativação (ativo/inativo). Sem categorias de serviço e sem dados
  de pagamento (diferente do fornecedor).
- **Item de listagem**: subconjunto exibido na tabela (nome, razão social, CNPJ, telefone, status).
- **Permissão**: `financier:read` (ver/listar) e `financier:write` (criar/editar/ativar/desativar) —
  slugs do RBAC de parceiros. `financier:edit-sensitive` existe no catálogo mas **não se aplica** a
  estas telas (o financiador não tem campos sensíveis); não condiciona nenhum campo ou ação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com permissão consegue localizar um financiador específico (busca + filtro) e abrir seu detalhe em menos de 30 segundos.
- **SC-002**: Um usuário com permissão completa o cadastro de um novo financiador (6 campos) em uma única tela, sem sair do fluxo.
- **SC-003**: 100% das ações de escrita ficam indisponíveis para usuários sem `financier:write`; 100% do acesso de leitura/menu fica indisponível para usuários sem `financier:read`.
- **SC-004**: 100% das falhas de backend chegam ao usuário como mensagem amigável (zero códigos/status técnicos na UI).
- **SC-005**: Paridade funcional com as telas de fornecedores (010): as 4 jornadas (listar, criar, detalhar+status, editar) existem e passam pelos mesmos critérios de qualidade.

## Impacto Arquitetural (core-api) *(obrigatório se a feature toca `src/`)*

> Feature **exclusivamente do frontend (web-app), camada client/**. **Não** toca o `core-api`,
> nem os server-fns do `partners/server` (já prontos e simétricos ao supplier).

- **Bounded Contexts afetados**: N/A no core-api. No web-app: novo `partners/client` para financier
  (telas) + 1 subitem de menu no módulo `shell` + rotas. Consome server-fns existentes.
- **Novos agregados / Value Objects?**: Nenhum (o agregado Financier já existe server-side).
- **Novos eventos de domínio (outbox)?**: N/A.
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: NÃO — a server function é a única fronteira; os contratos já existem.
- **Possíveis violações da constituição (I–XII)?**: Nenhuma prevista. Espelha o molde validado da 010:
  views burras (§XI), núcleo agnóstico nas view-models, erros→tag (§V), só-tokens (§X), boundaries
  de import enforçadas por lint.

## Assumptions

- **Server-side pronto**: os 6 server-fns de financier (list/get/create/update/deactivate/reactivate)
  e seus contratos (`financier.io.ts`) já existem e são a fonte de verdade dos campos e validações.
- **Molde a espelhar**: `src/modules/partners/client/supplier-*` (feature 010) é o padrão estrutural;
  divergências apenas onde o domínio do financiador difere (sem categorias, sem pagamento/PIX).
- **RBAC**: os slugs `financier:read`/`financier:write`/`financier:edit-sensitive` já estão no
  catálogo `PARTNER_PERMISSIONS`; as permissões reais chegam via `useCurrentUser().permissions`.
- **Menu**: o RBAC de menu por subitem (feature 011) já está ligado; o subitem "Financiadores" nasce
  com `financier:read` exigido.
- **Reuso**: organismos `DataTable` e `PageHeader` (`shared/ui/organisms`) e helpers
  `partners/client/data` (`can`, `partners-error-tag`) são reaproveitados.
- **Fora de escopo**: geografia e ACTs (features próprias), colaboradores, e qualquer alteração no
  core-api ou nos server-fns. Baseline visual da listagem é opcional (como na 010, T041).
