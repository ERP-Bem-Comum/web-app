# Feature Specification: Telas de Colaboradores (partners)

**Feature Branch**: `015-collaborator-screens`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Telas de Colaboradores (módulo vertical partners no frontend web-app/v2) — implementa a US1/P1 do épico 008-partners, ainda não construída. Espelhar as features de telas já entregues (010-supplier-screens, 013-act-screens): listar, criar em duas etapas, editar, desativar com motivo e importar em lote (CSV). RBAC por collaborator:read/write. Adicionar o subitem 'Colaboradores' ao menu Gestão de Parceiros. Server-side já existe no core-api."

## Contexto

O épico **008-partners** define quatro tipos de parceiro: Colaborador, Fornecedor, Financiador e ACT.
As telas de Fornecedores (010), Financiadores (012), ACTs (013) e Estados e Municípios/Geografia (014)
já foram entregues. **Colaborador é a US1/P1 do épico e ainda não tem telas no frontend** — só existe o
lado servidor (domínio e permissões `collaborator:*` no core-api). Esta feature entrega a **camada de
telas** de Colaboradores, fechando a lacuna de escopo. O ACT (013) já entregue "espelha o núcleo do
Colaborador" e serve de referência próxima.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar e buscar colaboradores (Priority: P1)

Como administrador/ABC, quero ver a lista de colaboradores e localizar rapidamente um colaborador,
para acompanhar quem está vinculado e em que situação cadastral.

**Why this priority**: É o MVP do módulo — sem a listagem não há ponto de entrada para nenhuma das
demais ações. Entrega valor sozinha (consulta), mesmo antes de criar/editar.

**Independent Test**: Acessar `/colaboradores`, ver a tabela com nome (representante legal), e-mail e
situação cadastral; digitar na busca e confirmar que a lista filtra; ajustar o filtro de idade e
confirmar a redução da lista.

**Acceptance Scenarios**:

1. **Given** a lista de colaboradores, **When** o usuário digita um termo na busca, **Then** a tabela filtra por texto livre (representante legal ou e-mail).
2. **Given** a lista, **When** o usuário aplica o filtro de idade, **Then** apenas colaboradores na faixa etária correspondente (derivada da data de nascimento) permanecem visíveis.
3. **Given** a lista, **When** cada linha é exibida, **Then** mostra a situação cadastral (`Pré Cadastrado` ou `Cadastrado`) e o estado ativo/inativo de forma distinta.
4. **Given** que não existem colaboradores, **When** a lista carrega, **Then** um estado vazio amigável é exibido.

---

### User Story 2 - Cadastrar colaborador em duas etapas (Priority: P1)

Como administrador/ABC, quero criar um colaborador num pré-cadastro rápido e depois completar os dados,
para registrar pessoas mesmo quando ainda não tenho todas as informações pessoais.

**Why this priority**: É a razão de ser do módulo (cadastro). O fluxo em duas etapas é regra de negócio
central do legado.

**Independent Test**: Em `/colaboradores/adicionar`, preencher os 7 campos essenciais e salvar → o
colaborador aparece como `Pré Cadastrado`; abrir `/colaboradores/editar/:id`, completar os dados
pessoais e salvar → a situação muda para `Cadastrado`.

**Acceptance Scenarios**:

1. **Given** a tela "Adicionar", **When** o usuário preenche os 7 campos essenciais (Representante Legal, E-mail, Área, Função, Início de Contrato, Vínculo, CPF) e salva, **Then** o colaborador é criado com situação `Pré Cadastrado`.
2. **Given** um colaborador `Pré Cadastrado`, **When** o usuário completa os dados pessoais no Editar e salva, **Then** a situação passa a `Cadastrado`.
3. **Given** a tela "Adicionar", **When** um campo essencial está ausente ou inválido (ex.: CPF ou e-mail mal formado), **Then** o salvamento é bloqueado e o erro é sinalizado no campo correspondente.
4. **Given** uma falha do servidor ao salvar, **When** o usuário tenta salvar, **Then** uma mensagem amigável é exibida e os dados digitados são preservados.

---

### User Story 3 - Desativar colaborador com motivo (Priority: P2)

Como administrador/ABC, quero desativar um colaborador informando o motivo, para manter o histórico
sem perder rastreabilidade do porquê.

**Why this priority**: Importante para governança, mas depende da existência de colaboradores (US1/US2).

**Independent Test**: Abrir o modal de desativar de um colaborador; confirmar que o botão fica
desabilitado sem "Motivo"; selecionar um motivo e confirmar → o colaborador fica inativo.

**Acceptance Scenarios**:

1. **Given** o modal de Desativar, **When** o usuário não selecionou "Motivo", **Then** o botão "Desativar Colaborador(a)" permanece desabilitado.
2. **Given** o modal com um motivo selecionado, **When** o usuário confirma, **Then** o colaborador é marcado como inativo e a lista reflete a mudança.

---

### User Story 4 - Importar colaboradores em lote (Priority: P3)

Como administrador/ABC, quero importar vários colaboradores de uma vez por arquivo CSV, para agilizar
a carga inicial e migrações do legado.

**Why this priority**: Acelera operação em volume, mas é complementar ao cadastro manual (US2).

**Independent Test**: Em `/colaboradores`, enviar um CSV válido → colaboradores válidos são criados; um
CSV com linhas inválidas → o resultado reporta quantos foram criados e quantos falharam, com as linhas
problemáticas identificadas.

**Acceptance Scenarios**:

1. **Given** um arquivo CSV válido, **When** o usuário importa em lote, **Then** os colaboradores válidos são criados e o resultado informa `{ criados, falhas }`.
2. **Given** um CSV com linhas inválidas, **When** a importação roda, **Then** as linhas válidas são criadas e as inválidas são reportadas sem abortar o lote inteiro.
3. **Given** um arquivo acima do limite de tamanho permitido, **When** o usuário tenta importar, **Then** o envio é recusado com mensagem clara antes de qualquer processamento.

---

### Edge Cases

- **Permissão ausente para escrita**: usuário com apenas leitura (`collaborator:read`) vê a lista mas as ações de criar/editar/desativar/importar ficam ocultas ou desabilitadas.
- **Permissão ausente para leitura**: usuário sem `collaborator:read` não vê o item "Colaboradores" no menu nem acessa as rotas.
- **CPF/e-mail duplicado**: o cadastro é recusado com mensagem amigável (regra do servidor), preservando os dados digitados.
- **CSV malformado / com fórmulas**: conteúdo é tratado de forma segura (sem execução de fórmulas), e linhas inválidas viram falhas reportadas, não erro global.
- **Sessão expirada durante uma ação**: o usuário é redirecionado ao login sem perder a navegação anterior de forma confusa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir a lista de colaboradores com, no mínimo, representante legal, e-mail e situação cadastral, distinguindo `Pré Cadastrado`/`Cadastrado` e ativo/inativo.
- **FR-002**: O usuário MUST poder buscar colaboradores por texto livre (representante legal ou e-mail).
- **FR-003**: O usuário MUST poder filtrar a lista por idade, sendo a idade derivada da data de nascimento no próprio cliente. O sistema MUST NOT oferecer filtro por "programa" nem filtro de idade no servidor (FR-012 do épico 008).
- **FR-004**: O usuário MUST poder criar um colaborador informando os 7 campos essenciais (Representante Legal, E-mail, Área, Função, Início de Contrato, Vínculo, CPF), resultando na situação `Pré Cadastrado`.
- **FR-005**: O usuário MUST poder completar o cadastro de um colaborador `Pré Cadastrado` com os dados pessoais, promovendo a situação para `Cadastrado`.
- **FR-006**: O sistema MUST validar os campos no cliente antes do envio (e-mail, CPF e obrigatórios), bloqueando o salvamento e sinalizando o erro no campo.
- **FR-007**: O usuário MUST poder desativar um colaborador por meio de um modal que EXIGE a seleção de um "Motivo"; o botão de confirmação MUST permanecer desabilitado enquanto não houver motivo.
- **FR-008**: O usuário MUST poder importar colaboradores em lote por arquivo CSV; o sistema MUST aceitar somente CSV, recusar arquivos acima do limite de tamanho, e retornar um resumo `{ criados, falhas }` com as linhas inválidas identificadas.
- **FR-009**: O processamento do CSV MUST ser seguro contra injeção de fórmulas e MUST NOT depender de formatos de planilha (ex.: `.xlsx`).
- **FR-010**: O sistema MUST refletir o RBAC do servidor: exibir conteúdo apenas com `collaborator:read` e ocultar/desabilitar as ações de escrita (criar/editar/desativar/importar) sem `collaborator:write`.
- **FR-011**: O sistema MUST exibir o subitem "Colaboradores" no menu "Gestão de Parceiros", visível apenas quando o usuário tem `collaborator:read`, posicionado junto aos demais parceiros.
- **FR-012**: Em qualquer falha do servidor, o sistema MUST exibir mensagem amigável e preservar os dados já digitados pelo usuário (sem perda de trabalho).
- **FR-013**: As rotas MUST ser `/colaboradores` (lista), `/colaboradores/adicionar` (criar) e `/colaboradores/editar/:id` (editar/completar).

### Key Entities *(include if feature involves data)*

- **Colaborador**: pessoa física (PF) vinculada a programas. Atributos essenciais: representante legal, e-mail, área, função, início de contrato, vínculo, CPF; atributos complementares (dados pessoais, ex.: data de nascimento) no cadastro completo. Possui **situação cadastral** (`Pré Cadastrado` → `Cadastrado`) e um estado **ativo/inativo** independente, com motivo de desativação.
- **Resultado de Importação**: resumo de um lote CSV — quantidade de registros criados e relação de linhas que falharam (com a razão), sem abortar o lote.

## Impacto Arquitetural (core-api) *(obrigatório se a feature toca `src/`)*

> Esta feature é **frontend-only** (web-app/v2). O lado servidor de Colaborador (domínio, persistência,
> permissões `collaborator:*`) **já existe no core-api** e é consumido via a fronteira BFF.

- **Bounded Contexts afetados**: [x] Parceiros (`partners`) — apenas a camada de telas do client. Sem novo BC.
- **Novos agregados / Value Objects?**: Nenhum no servidor. No client, modela-se Colaborador e Situação Cadastral como dados de leitura/escrita validados na borda.
- **Novos eventos de domínio (outbox)?**: N/A (frontend).
- **Novos subcomandos de CLI?**: N/A.
- **Borda HTTP envolvida?**: Consome endpoints existentes de Colaborador no core-api via server functions (BFF) — sem novos endpoints no backend.
- **Possíveis violações da constituição?**: Nenhuma prevista — espelha o padrão de 010/013, respeitando boundaries, erros-como-valor, design system só-tokens, i18n e views burras (MVVM).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador consegue criar um pré-cadastro de colaborador (7 campos) e vê-lo na lista em menos de 2 minutos.
- **SC-002**: Um administrador consegue localizar um colaborador específico em uma lista de 500+ registros em menos de 10 segundos usando busca/filtro.
- **SC-003**: 100% das ações de escrita ficam indisponíveis para usuários sem permissão de escrita (nenhuma ação de criar/editar/desativar/importar acessível só-leitura).
- **SC-004**: Em uma importação de 100 linhas com 10 inválidas, o sistema cria as 90 válidas e reporta exatamente as 10 falhas, sem perder o lote.
- **SC-005**: O subitem "Colaboradores" aparece no menu para usuários com leitura e não aparece para usuários sem ela, em 100% dos casos.
- **SC-006**: Em falha do servidor durante o cadastro, 100% dos dados já digitados são preservados na tela.

## Assumptions

- O lado servidor de Colaborador no core-api está disponível e estável (domínio + permissões `collaborator:read`/`collaborator:write`), conforme o épico 008 e os módulos já entregues.
- O comportamento de referência (campos, situação cadastral, regras de filtro) segue o legado e o já implementado em ACT (013), que "espelha o núcleo do Colaborador".
- O limite de tamanho do CSV e o formato seguem o definido no épico 008 (CSV-only, limite de ~2 MiB) — confirmável no plano técnico.
- A feature é apenas a camada de telas (frontend); nenhuma mudança de schema/endpoint no backend é necessária.
- Mobile/responsividade segue o padrão já adotado nas demais telas de parceiros (não há requisito novo específico).
