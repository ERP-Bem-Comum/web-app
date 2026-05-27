# Feature Specification: Migração do Módulo de Contratos para TanStack Start

**Feature Branch**: `001-contratos-tanstack-start`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Migrar o módulo de Contratos do Next.js 16 para TanStack Start (Vite + TanStack Router), usando arquitetura em camadas DDD, Server Functions BFF, shadcn/ui e auth com cookie HttpOnly. O resto do sistema pode quebrar. Usar o contrato OpenAPI já definido em handbook/contratos/openapi.yaml como fonte da verdade."

---

## User Scenarios & Testing

### User Story 1 — Autenticação e Acesso (Priority: P1)

Como usuário do ERP, quero fazer login com email e senha para acessar o módulo de contratos, para que meus dados estejam protegidos e eu tenha acesso apenas às funcionalidades autorizadas.

**Why this priority**: Sem auth funcional, nenhuma outra feature é acessível. É a porta de entrada.

**Independent Test**: Pode ser testado isoladamente acessando `/login`, inserindo credenciais válidas e sendo redirecionado para `/contratos`.

**Acceptance Scenarios**:

1. **Given** que estou na tela de login, **When** insiro credenciais válidas e clico em "Entrar", **Then** sou autenticado, um cookie HttpOnly é criado e sou redirecionado para `/contratos`.
2. **Given** que estou autenticado, **When** clico em "Sair", **Then** o cookie é removido e sou redirecionado para `/login`.
3. **Given** que tento acessar `/contratos` sem estar autenticado, **When** a rota é carregada, **Then** sou redirecionado para `/login`.

---

### User Story 2 — Listar Contratos (Priority: P1)

Como usuário autenticado, quero ver uma lista paginada de contratos com filtros (tipo, status, período, plano orçamentário) e busca textual, para que eu possa localizar rapidamente os contratos que preciso gerenciar.

**Why this priority**: Listagem é a tela principal do módulo e o ponto de entrada para todas as outras operações.

**Independent Test**: Pode ser testado isoladamente acessando `/contratos` e verificando se a lista carrega com paginação e filtros funcionais.

**Acceptance Scenarios**:

1. **Given** que estou autenticado, **When** acesso `/contratos`, **Then** vejo uma tabela com contratos paginados (10 por padrão), ordenados decrescente por ID.
2. **Given** que estou na listagem, **When** digito um termo na busca, **Then** a lista é filtrada em tempo real (com debounce) mostrando apenas contratos que correspondem.
3. **Given** que estou na listagem, **When** seleciono um filtro de status (ex: "Em andamento"), **Then** apenas contratos com aquele status derivado são exibidos.
4. **Given** que estou na listagem, **When** clico em "Exportar CSV" ou "Exportar PDF", **Then** um arquivo é baixado com os dados filtrados.

---

### User Story 3 — Criar Contrato (Priority: P1)

Como usuário autenticado, quero criar um novo contrato ou ordem de serviço preenchendo um formulário com validações em tempo real, para que eu possa registrar novas contratações no sistema.

**Why this priority**: Criação é uma operação crítica do dia a dia do gestor de contratos.

**Independent Test**: Pode ser testado isoladamente acessando `/contratos/adicionar`, preenchendo o formulário e submetendo.

**Acceptance Scenarios**:

1. **Given** que estou autenticado, **When** acesso `/contratos/adicionar`, **Then** vejo um formulário com todos os campos obrigatórios (classificação, modelo, objeto, valor, período, tipo, contratante).
2. **Given** que seleciono "Ordem de Serviço" como classificação, **When** informo um valor maior que R$ 9.999,99, **Then** vejo uma mensagem de erro de validação antes de submeter.
3. **Given** que seleciono tipo "Fornecedor", **When** tento submeter sem informar PIX ou dados bancários, **Then** o formulário exibe erro obrigatório.
4. **Given** que preencho o formulário corretamente, **When** clico em "Salvar", **Then** o contrato é criado, aparece na listagem e sou redirecionado para os detalhes.
5. **Given** que estou preenchendo o formulário, **When** navego para outra página e retorno, **Then** meu rascunho foi preservado (auto-save em sessionStorage).

---

### User Story 4 — Visualizar Detalhes e Timeline (Priority: P1)

Como usuário autenticado, quero visualizar os detalhes completos de um contrato, incluindo sua timeline de eventos (criação, aditivos, homologações), para que eu possa acompanhar o histórico e o status atual.

**Why this priority**: Detalhes é onde o usuário toma decisões sobre aditivos, rescisão e acompanhamento.

**Independent Test**: Pode ser testado isoladamente acessando `/contratos/detalhes/123` e verificando a timeline.

**Acceptance Scenarios**:

1. **Given** que estou autenticado, **When** clico em um contrato na listagem, **Then** sou direcionado para `/contratos/detalhes/$id` com todos os dados do contrato.
2. **Given** que estou na tela de detalhes, **Then** vejo a timeline ordenada do mais recente para o mais antigo, com o evento "Contrato criado" sempre como o primeiro nó (mais antigo).
3. **Given** que o contrato tem aditivos, **When** visualizo a timeline, **Then** aditivos homologados mostram apenas o evento de homologação; aditivos pendentes mostram criação + pendente; rascunhos mostram apenas criação.
4. **Given** que o contrato está em "Rascunho", **When** estou na tela de detalhes, **Then** posso editar os dados do contrato base diretamente.

---

### User Story 5 — Adicionar Aditivo (Priority: P2)

Como usuário autenticado, quero adicionar aditivos (prazo, valor, escopo, distrato) a um contrato existente, para que eu possa registrar alterações contratuais sem criar um novo contrato.

**Why this priority**: Aditivos são operações frequentes em contratos de longo prazo, mas dependem da tela de detalhes funcionar.

**Independent Test**: Pode ser testado a partir da tela de detalhes, clicando em "Novo Aditivo".

**Acceptance Scenarios**:

1. **Given** que estou na tela de detalhes de um contrato, **When** clico em "Novo Aditivo", **Then** sou direcionado para `/contratos/aditivo/$id` com o formulário de aditivo.
2. **Given** que seleciono tipo "valor", **When** informo um valor e anexo o documento com data de assinatura, **Then** o aditivo é criado com status "Homologado".
3. **Given** que seleciono tipo "prazo", **When** não informo a nova data fim, **Then** o formulário exibe erro de validação.
4. **Given** que crio um aditivo sem documento, **When** submeto, **Then** o aditivo é criado com status "Pendente".

---

### User Story 6 — Atualizar Dados Bancários (Priority: P2)

Como usuário autenticado, quero editar as informações bancárias e PIX de um contrato diretamente na tela de detalhes, para manter os dados de pagamento sempre atualizados.

**Why this priority**: Operação de manutenção frequente, mas pode ser feita depois do core funcionar.

**Independent Test**: Testar na tela de detalhes, abrindo o modal de edição de dados bancários.

**Acceptance Scenarios**:

1. **Given** que estou na tela de detalhes, **When** clico em editar dados bancários, **Then** um modal abre com os campos de PIX e dados bancários.
2. **Given** que removo todos os dados bancários e PIX, **When** tento salvar, **Then** vejo erro informando que pelo menos um método de pagamento é obrigatório.

---

### Edge Cases

- **Contrato sem internet**: quando o backend está offline, o sistema deve salvar no localDb e sincronizar quando voltar (fallback já existe no legado; manter comportamento).
- **Valor zero ou negativo**: o sistema deve aceitar valores zero? ( atualmente permite zero no aditivo, mas não no contrato base)
- **Arquivo muito grande**: upload deve ter limite de tamanho (a definir pelo backend).
- **Duplo clique em salvar**: o formulário deve desabilitar o botão durante a submissão para evitar duplicação.
- **Sessão expirada durante operação**: o sistema deve redirecionar para login e, após reautenticação, retomar a operação (ideal) ou perder o estado (aceitável para MVP).

---

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE autenticar usuários via cookie HttpOnly com token JWT.
- **FR-002**: O sistema DEVE listar contratos com paginação, filtros e busca textual.
- **FR-003**: O sistema DEVE criar contratos com validação de classificação (Contrato vs Ordem de Serviço com teto de R$ 9.999,99).
- **FR-004**: O sistema DEVE criar aditivos vinculados a um contrato pai.
- **FR-005**: O sistema DEVE exibir timeline de eventos do contrato com ordenação correta.
- **FR-006**: O sistema DEVE permitir editar dados bancários/PIX do contrato.
- **FR-007**: O sistema DEVE exportar contratos em CSV e PDF.
- **FR-008**: O sistema DEVE fazer upload de arquivos anexos (contrato assinado, termo de acerto, termo de rescisão).
- **FR-009**: O sistema DEVE implementar auto-save de rascunho no formulário de contrato.
- **FR-010**: O sistema DEVE permitir editar contratos em status "Rascunho".
- **FR-011**: Todas as chamadas ao backend DEVEm passar por Server Functions BFF (`createServerFn`).
- **FR-012**: O contrato OpenAPI (`handbook/contratos/openapi.yaml`) DEVE ser a fonte da verdade para schemas de request/response.

### Key Entities

- **Contract (Contrato)**: Representa uma contratação formal. Atributos chave: id, classification, contractType, object, totalValue, contractPeriod, supplier/financier/collaborator, status, children (aditivos).
- **Aditivo (Children)**: Modificação contratual vinculada a um contrato pai. Atributos: parentId, aditivoType, aditivoStatus, totalValue (delta), contractPeriod (novo prazo).
- **ContractRow**: View model da listagem. Inclui dados agregados para exibição rápida na tabela.
- **ContractPaymentHistory**: Histórico financeiro e de ações de um contrato. Inclui payables, receivables e log de auditoria.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A tela de listagem carrega em menos de 2 segundos com 100 contratos (meta de performance).
- **SC-002**: O formulário de criação de contrato valida todos os campos obrigatórios antes de submeter (zero requests com erro 422 por validação de frontend).
- **SC-003**: A timeline exibe corretamente 100% dos eventos na ordem cronológica correta (mais recente primeiro, contrato base sempre como nó inicial).
- **SC-004**: O build (`pnpm build`) gera output sem erros e o deploy funciona no Firebase Hosting.
- **SC-005**: Testes unitários cobrem ≥ 80% da camada de domain do módulo de contratos.
- **SC-006**: O sistema funciona integralmente com o backend offline (fallback para localDb) — paridade com o legado.

---

## Assumptions

- O backend NestJS já tem (ou terá) os endpoints definidos no contrato OpenAPI `handbook/contratos/openapi.yaml`.
- O mock local (`src/mocks/localDb.ts`) será mantido durante a transição para permitir desenvolvimento offline.
- A feature de "contratos" é a única que precisa estar 100% funcional; todas as outras features podem retornar 404 ou estar quebradas.
- Os usuários já conhecem o fluxo de contratos do sistema legado; não há necessidade de onboarding ou tour guiado.
- A autenticação será baseada no mesmo mecanismo do legado (CredentialsProvider do NextAuth) mas reimplementado com cookie HttpOwn em TanStack Start.
- O Orval será atualizado futuramente para gerar clients a partir do OpenAPI; por ora, usamos Server Functions manuais baseados no contrato.
