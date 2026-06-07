# Feature Specification: Telas de Fornecedores (Suppliers)

**Feature Branch**: `010-supplier-screens`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Telas de Fornecedores (suppliers) — primeiro vertical de UI do módulo de parceiros (MVP). 4 telas completas (listar, criar, editar, detalhar) consumindo o BFF de supplier já pronto e a fundação de organismos, espelhando o módulo contracts/client."

## Visão Geral

O módulo de parceiros já tem o **backend (BFF) pronto** — server functions para listar, obter, criar, atualizar, inativar e reativar fornecedores, além de listar categorias de serviço. Falta a **interface**. Esta feature entrega as **4 telas de Fornecedores** (o primeiro vertical de UI do módulo de parceiros), espelhando o módulo `contracts` (a feature de referência) e **consumindo a fundação de organismos** (a tabela genérica e o cabeçalho de página), em vez de recriar componentes locais.

É o MVP que prova o padrão de telas de parceiros — as outras 3 entidades (financiadores, geografia, ACTs) seguirão o mesmo molde em features futuras.

## User Scenarios & Testing *(mandatory)*

> Usuário primário: um **gestor/operador** do ERP com permissões de fornecedor (`supplier:read`, `supplier:write`, `supplier:edit-sensitive`). As telas respeitam essas permissões.

### User Story 1 - Listar e encontrar fornecedores (Priority: P1)

Um operador abre a tela de Fornecedores e vê a lista paginada. Ele busca por texto (nome/razão/CNPJ), filtra por status (ativo/inativo) e por categorias de serviço, e ordena a lista — para encontrar rapidamente o fornecedor que procura.

**Why this priority**: É a porta de entrada do módulo e a tela de maior uso. Sozinha já entrega valor (visualização e busca) e é o esqueleto sobre o qual as demais telas se conectam (navegação para detalhe/criar/editar).

**Independent Test**: Abrir `/fornecedores`, ver a lista com dados reais; digitar uma busca e ver a lista filtrar; alternar o filtro de status e ver o resultado mudar; navegar entre páginas. Tudo contra o BFF real.

**Acceptance Scenarios**:

1. **Given** existem fornecedores cadastrados, **When** o operador abre a tela, **Then** vê uma tabela paginada com nome, CNPJ, e-mail, categoria e status de cada fornecedor.
2. **Given** a lista carregando, **When** a tela é exibida, **Then** um indicador de carregamento aparece (sem mostrar dados ainda).
3. **Given** uma busca por texto, **When** o operador digita, **Then** a lista passa a refletir o termo buscado.
4. **Given** filtros de status e categoria, **When** o operador os aplica, **Then** a lista mostra só os fornecedores correspondentes.
5. **Given** nenhum resultado para os filtros, **When** a busca não casa, **Then** uma mensagem de "nenhum resultado" é exibida.
6. **Given** uma falha ao carregar, **When** o BFF retorna erro, **Then** uma mensagem de erro (via i18n) é exibida sem quebrar a tela.
7. **Given** o operador clica numa linha/ação, **When** escolhe "ver", **Then** navega para o detalhe daquele fornecedor.

---

### User Story 2 - Cadastrar um novo fornecedor (Priority: P1)

Um operador com permissão de escrita cria um fornecedor: preenche dados básicos (nome, razão social, nome fantasia, e-mail, CNPJ, categoria de serviço) e, opcionalmente, dados bancários e chave PIX. Ao salvar, o fornecedor é criado e ele é levado de volta à lista (ou ao detalhe) com o novo registro presente.

**Why this priority**: Criar é a ação que popula o módulo; junto da listagem forma o ciclo mínimo de uso (ver + adicionar). P1 porque sem criar, a lista vive vazia.

**Independent Test**: Abrir `/fornecedores/criar`, preencher o formulário com dados válidos, salvar, e confirmar que o novo fornecedor aparece na listagem. Tentar salvar com dados inválidos e ver as mensagens de validação.

**Acceptance Scenarios**:

1. **Given** o formulário de criação, **When** o operador preenche os dados básicos válidos e salva, **Then** o fornecedor é criado e ele recebe confirmação (navegação para lista/detalhe).
2. **Given** um campo obrigatório vazio ou inválido (ex.: CNPJ malformado, e-mail inválido), **When** o operador tenta salvar, **Then** a validação bloqueia o envio e indica o campo com erro (sem chamar o backend).
3. **Given** dados bancários e/ou PIX preenchidos, **When** salva, **Then** esses dados são persistidos junto.
4. **Given** o backend rejeita (ex.: CNPJ duplicado), **When** o operador salva, **Then** a mensagem de erro correspondente (via i18n) é exibida.
5. **Given** a operação em andamento, **When** o operador salva, **Then** o botão de salvar fica em estado "ocupado" e não dispara envios duplicados.
6. **Given** um operador SEM permissão de escrita, **When** acessa a tela, **Then** a criação não é oferecida/é bloqueada.

---

### User Story 3 - Detalhar um fornecedor e mudar seu status (Priority: P1)

Um operador abre o detalhe de um fornecedor e vê todos os seus dados (básicos + bancários + PIX). A partir daí, pode **inativar** um fornecedor ativo (ou **reativar** um inativo), com confirmação.

**Why this priority**: O detalhe é o destino natural da listagem e o ponto onde ações de ciclo de vida (inativar/reativar) acontecem. Completa a navegação ver→detalhe→ação.

**Independent Test**: Navegar da lista para o detalhe de um fornecedor; ver todos os campos; acionar "inativar" e confirmar que o status muda; reativar e ver voltar a ativo.

**Acceptance Scenarios**:

1. **Given** um fornecedor existente, **When** o operador abre seu detalhe, **Then** vê os dados básicos e, se houver, os dados bancários e a chave PIX.
2. **Given** um fornecedor ativo, **When** o operador aciona "inativar" e confirma, **Then** o status passa a inativo e a tela reflete a mudança.
3. **Given** um fornecedor inativo, **When** o operador aciona "reativar" e confirma, **Then** o status volta a ativo.
4. **Given** um id inexistente, **When** o operador acessa o detalhe, **Then** uma mensagem de "não encontrado" (via i18n) é exibida.
5. **Given** dados sensíveis (bancário/PIX), **When** o operador NÃO tem `supplier:edit-sensitive`, **Then** esses dados são tratados conforme a permissão (ocultos/somente-leitura).

---

### User Story 4 - Editar um fornecedor (Priority: P2)

Um operador com permissão de escrita abre a edição de um fornecedor, ajusta os campos (básicos e, com permissão sensível, bancário/PIX) e salva as alterações.

**Why this priority**: Importante para manutenção dos dados, mas vem depois do ciclo ver/criar/detalhar — a edição reaproveita o mesmo formulário da criação, então é incremento de baixo custo após US2.

**Independent Test**: Abrir `/fornecedores/{id}/editar`, alterar um campo, salvar, e confirmar a alteração no detalhe/lista.

**Acceptance Scenarios**:

1. **Given** um fornecedor existente, **When** o operador abre a edição, **Then** o formulário vem pré-preenchido com os dados atuais.
2. **Given** uma alteração válida, **When** o operador salva, **Then** os dados são atualizados e ele recebe confirmação.
3. **Given** uma alteração inválida, **When** tenta salvar, **Then** a validação bloqueia e indica o erro.
4. **Given** um operador sem permissão de escrita, **When** tenta editar, **Then** a edição é bloqueada.

---

### Edge Cases

- **Lista vazia (nenhum fornecedor)**: estado vazio distinto de "nenhum resultado para o filtro".
- **Busca + filtros combinados**: aplicar busca textual e filtros simultâneos resulta na interseção.
- **Paginação na borda**: última página com menos itens; mudar filtro reseta para a página 1.
- **CNPJ com e sem máscara**: o operador pode digitar com ou sem máscara; a validação aceita ambos.
- **Bancário/PIX parciais**: se o operador começa a preencher dados bancários, os subcampos obrigatórios do grupo passam a ser exigidos (grupo "tudo ou nada").
- **Permissões**: leitura sem escrita (só vê), escrita sem sensível (cria/edita mas não toca bancário/PIX), ausência de leitura (não acessa o módulo).
- **Ação concorrente**: inativar enquanto a página ainda carrega; salvar duas vezes (deve ser idempotente/bloqueado).
- **Erro de rede/sessão expirada (401)**: tratado pela cadeia de erro global (signOut/redirect), não pela tela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de listagem MUST exibir os fornecedores em formato tabular paginado, com as colunas nome, CNPJ, e-mail, categoria de serviço e status (ativo/inativo).
- **FR-002**: A listagem MUST permitir busca por texto, filtro por status (ativo/inativo), filtro por categorias de serviço, e ordenação; os filtros/paginação MUST ser refletidos de forma que o estado da listagem seja compartilhável/restaurável (ex.: via URL).
- **FR-003**: A listagem MUST exibir, de forma mutuamente exclusiva, os estados de carregando, vazio (sem fornecedores), sem-resultado (filtros não casam) e erro.
- **FR-004**: A tela de criação MUST oferecer um formulário com os dados básicos obrigatórios (nome, razão social, nome fantasia, e-mail, CNPJ, categoria de serviço) e os grupos opcionais de dados bancários e chave PIX.
- **FR-005**: O formulário MUST validar os campos na borda do cliente antes de enviar (e-mail válido, CNPJ válido com ou sem máscara, campos obrigatórios preenchidos, grupo bancário "tudo ou nada"), bloqueando o envio quando inválido.
- **FR-006**: As categorias de serviço oferecidas no formulário/filtros MUST vir da fonte do backend (lista de categorias), não de uma lista fixa no cliente.
- **FR-007**: A criação e a edição MUST exibir o estado "ocupado" durante o envio e MUST NOT permitir envios duplicados concorrentes.
- **FR-008**: A tela de detalhe MUST exibir todos os dados do fornecedor (básicos + bancários + PIX quando presentes) e o status atual.
- **FR-009**: A partir do detalhe, o operador MUST poder **inativar** um fornecedor ativo e **reativar** um inativo, com confirmação explícita; a tela MUST refletir a mudança de status após a ação.
- **FR-010**: A tela de edição MUST vir pré-preenchida com os dados atuais e MUST persistir as alterações válidas.
- **FR-011**: Todas as telas MUST respeitar o RBAC de fornecedor: `supplier:read` para visualizar; `supplier:write` para criar/editar/inativar/reativar; `supplier:edit-sensitive` para criar/editar dados bancários e PIX. Ações não permitidas MUST NOT ser oferecidas/executáveis.
- **FR-012**: Toda falha do backend MUST ser apresentada ao usuário como uma mensagem amigável (via i18n), derivada do tipo do erro — a tela MUST NOT expor status HTTP ou detalhes técnicos.
- **FR-013**: Todas as strings visíveis MUST vir do sistema de i18n (namespace de fornecedores), nunca literais embutidas.
- **FR-014**: A listagem MUST consumir o organismo de **tabela de dados** e o de **cabeçalho de página** do design system, em vez de recriar tabela/cabeçalho locais.
- **FR-015**: A navegação MUST conectar as telas: lista → detalhe, lista → criar, detalhe → editar, e retornos após salvar.

### Key Entities

- **Fornecedor (Supplier)**: parceiro prestador de serviço. Atributos: nome, razão social, nome fantasia, e-mail, CNPJ, categoria de serviço, status (ativo/inativo) e, opcionalmente, conta bancária e chave PIX. Identificado por um id.
- **Conta bancária**: dado sensível opcional — banco, agência, número da conta, dígito.
- **Chave PIX**: dado sensível opcional — tipo (CPF/CNPJ/e-mail/telefone/aleatória) + valor da chave.
- **Categoria de serviço**: rótulo que classifica o fornecedor; conjunto fornecido pelo backend.
- **Permissão de fornecedor**: `supplier:read` · `supplier:write` · `supplier:edit-sensitive` (governam o que o operador pode ver/fazer).

## Impacto Arquitetural (web-app) *(esta feature toca `src/`)*

> Feature **puramente frontend** (web-app). O **backend de fornecedores já está pronto** — sem alteração no core-api.

- **Bounded Contexts (core-api) afetados**: **N/A** — nenhuma mudança no backend.
- **Camada do web-app afetada**: `src/modules/partners/client/` (novo: telas de supplier), `src/routes/_authenticated/` (novas rotas), `src/shared/i18n/` (namespace de fornecedores). Consome `src/modules/partners/public-api` (server fns) e `#shared/ui` (organismos).
- **Constituição / ADRs**: §I (módulo vertical), §III (server fn única fronteira), §V (cadeia de erro), §IX (RBAC/permissões), §X (só-tokens/i18n), §XI (MVVM/views burras). Espelha o `contracts` (feature-modelo).
- **Fronteiras de import (lint)**: respeitar `client/data → server-adapters`; views burras; sem import de `server/domain|application`.
- **Possíveis violações**: nenhuma prevista — é replicação do padrão `contracts` já validado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador consegue **encontrar um fornecedor específico** (por busca/filtro) e abrir seu detalhe em poucos passos, a partir da lista.
- **SC-002**: Um operador consegue **cadastrar um novo fornecedor** com dados válidos e vê-lo aparecer na listagem, sem erro.
- **SC-003**: Um operador consegue **inativar e reativar** um fornecedor pelo detalhe, com a mudança de status visível imediatamente.
- **SC-004**: As 4 telas são compostas **consumindo os organismos do design system** (tabela + cabeçalho) e os server-fns existentes — **sem recriar** tabela/cabeçalho locais nem duplicar regras de domínio no cliente.
- **SC-005**: Toda condição de erro (validação, CNPJ duplicado, não-encontrado, falha de rede) resulta numa **mensagem amigável** ao usuário, nunca num status HTTP cru ou tela quebrada.
- **SC-006**: As permissões são respeitadas: um operador sem escrita não consegue criar/editar/mudar status; sem sensível, não manipula bancário/PIX.
- **SC-007**: O padrão entregue é **replicável**: criar as telas das próximas entidades (financiadores etc.) é seguir o mesmo molde, sem reprojetar a arquitetura.

## Assumptions

- **MVP só Fornecedores**: financiadores, geografia e ACTs estão **fora de escopo** (features seguintes). O backend de supplier já está pronto e **não** é alvo deste trabalho.
- **Espelhar `contracts/client`**: a arquitetura (data → repository → view-model → binding → ui), o tratamento de erro e o padrão de rotas seguem o módulo `contracts`, a feature de referência viva.
- **Consumir organismos**: a listagem usa `DataTable` e `PageHeader` de `#shared/ui` (spec 009). Filtros/busca/paginação e o formulário podem ter componentes locais ao módulo (a fundação de organismos ainda não cobre barra de controles/modal/form — specs futuras); o que for genérico e já existir como organismo MUST ser reusado.
- **Confirmação de status**: inativar/reativar pedem confirmação explícita; como o diálogo modal genérico ainda não é organismo (fora do escopo da 009), a confirmação usa um componente local ou primitivo nativo, mantendo a UX de confirmação.
- **Rota**: as telas vivem sob uma rota de fornecedores no app autenticado (ex.: `/fornecedores` ou `/parceiros/fornecedores` — decisão fina no plano), protegidas pela área `_authenticated`.
- **RBAC**: as permissões do operador vêm do contexto de sessão/rota (como já ocorre no shell); a checagem usa o helper `can()` já existente em `partners/client/data/helpers/can.ts`.
- **Stack/invariantes do projeto** (constituição §I–§XII): views burras, server-state no TanStack Query, erros como valores + switch exaustivo → i18n, validação na fronteira com Zod, só-tokens no CSS, a server function é a única fronteira.
