# Feature Specification: Consumo da numeração real + programa/classificação de contratos (handoff #32)

**Feature Branch**: `019-contract-number-program`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Consumir no frontend (web-app v2) as novidades de CONTRATOS da branch core-api `feat/backlog-front-handoff` (PR #32) — fatia 'numeração + programa/classificação + ajuste do create'. Frontend-only, módulo contracts, mudanças aditivas, sem tocar no core-api."

## Resumo

O backend de contratos passou a **gerar o número do contrato** (sequencial por ano) e a **persistir/retornar** a classificação (CT/OS) e os metadados de cadastro (programa, plano orçamentário, categorização, centro de custo). O formato de criação de contrato também mudou. Esta feature alinha o **frontend** a esse novo comportamento: passar a exibir o número e os metadados **reais**, remover a numeração inventada hoje no app, e ajustar o fluxo de criação para continuar funcionando. É **frontend-only** e **aditiva** — não altera o backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Número de contrato confiável e criação aderente (Priority: P1)

Como usuária da gestão de contratos, quero **criar um contrato sem precisar inventar um número** e ver o **número oficial** que o sistema atribuiu (no padrão `CT 0001/2026` ou `OS 0001/2026`), para poder referenciar o contrato com confiança e sem duplicidade.

**Why this priority**: É o motivo do ticket original (CTR-CONTRACT-SEQUENTIAL-NUMBER). Hoje o app **inventa um número aleatório** na criação — o número exibido não é confiável e o prefixo é sempre "CT". Além disso, o formato de criação mudou no backend: **se o app continuar criando do jeito antigo, a inclusão de contrato quebra** (regressão crítica). Portanto este item, além de entregar o valor central, é o que evita a regressão.

**Independent Test**: Criar um contrato (rascunho) e um contrato com assinatura; em ambos, a inclusão conclui com sucesso, o sistema atribui o número sequencial, e o grid/detalhe exibem esse número com o prefixo correto (CT para Contrato, OS para Ordem de Serviço). Criar dois contratos no mesmo ano e confirmar que os números são distintos e crescentes.

**Acceptance Scenarios**:

1. **Given** que a usuária preenche o formulário de novo contrato como **Contrato** sem informar número, **When** ela salva, **Then** a inclusão conclui, o sistema atribui um número e o detalhe/grid exibem `CT NNNN/AAAA`.
2. **Given** que a usuária cria um registro como **Ordem de Serviço**, **When** ela salva, **Then** o número exibido usa o prefixo `OS NNNN/AAAA`.
3. **Given** que a usuária cria o contrato como rascunho e depois anexa o documento assinado (fluxo de 2 passos: criar → anexar/ativar), **When** conclui a efetivação, **Then** o contrato fica efetivado — o número atribuído pelo sistema é exibido em ambos os passos.
4. **Given** dois contratos criados no mesmo ano, **When** a usuária consulta o grid, **Then** os dois números são diferentes e crescentes.
5. **Given** uma falha do backend na criação, **When** a usuária salva, **Then** uma mensagem amigável é exibida (sem detalhe técnico) e ela permanece no formulário.

---

### User Story 2 - Programa e metadados visíveis (Priority: P2)

Como usuária da gestão de contratos, quero ver o **Programa** (e os demais metadados de cadastro) **preenchidos** no grid e no detalhe — em vez de "—" —, para identificar a que programa/plano cada contrato pertence.

**Why this priority**: É uma melhoria de **leitura** de alto valor (a coluna Programa hoje é sempre "—"), mas não bloqueia a criação. Depende de o backend retornar os campos (já retorna no #32). Pode ser entregue após a US1.

**Independent Test**: Criar um contrato associado a um programa; conferir que a coluna **Programa** do grid mostra a sigla do programa, e que o detalhe mostra programa, plano orçamentário, categorização e centro de custo quando presentes; conferir que um contrato sem programa mostra "—" graciosamente.

**Acceptance Scenarios**:

1. **Given** um contrato vinculado a um programa, **When** a usuária abre o grid, **Then** a coluna **Programa** exibe a sigla do programa (não "—").
2. **Given** um contrato vinculado a um programa, **When** a usuária abre o detalhe, **Then** programa, plano orçamentário, categorização e centro de custo aparecem preenchidos quando existem.
3. **Given** um contrato **sem** programa, **When** a usuária abre grid/detalhe, **Then** os campos correspondentes mostram "—" sem erro.

---

### Edge Cases

- **Classificação ausente/desconhecida** no retorno: o app deve exibir um prefixo padrão seguro (CT) sem quebrar, mas a classificação real, quando vier, prevalece.
- **Programa nulo** (contrato sem programa): grid e detalhe mostram "—" sem erro de renderização.
- **Metadados nulos** (categorização/centro de custo vazios): exibir vazio/"—", nunca "null".
- **Criação em modo cadastro+assinatura sem data**: bloqueado na borda do app com mensagem clara.
- **Contrato pré-existente sem os novos campos** (cenário de dados antigos): tratado como ausente → "—".
- **Número fora do formato esperado** vindo do backend: exibir o que veio sem inventar/normalizar de forma destrutiva.
- **Status novo do backend** (ex.: `Cancelled` do #32, fora do escopo desta fatia): a leitura **não quebra** o grid/detalhe (D9 — branch de escape no parse + degradação segura do status); o fluxo/UI próprio de cancelamento fica para slice futuro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O app MUST exibir o número do contrato **exatamente como atribuído pelo sistema** (sequencial por ano), no grid e no detalhe.
- **FR-002**: O app MUST NOT gerar, inventar ou alterar número de contrato em nenhum fluxo (a geração aleatória atual é removida).
- **FR-003**: O app MUST exibir o **prefixo conforme a classificação real** retornada (CT para Contrato, OS para Ordem de Serviço), em vez de assumir "CT" sempre.
- **FR-004**: O grid de contratos MUST exibir a **sigla do Programa** quando o contrato tiver programa, e "—" quando não tiver.
- **FR-005**: O detalhe do contrato MUST exibir **programa, plano orçamentário, categorização e centro de custo** quando presentes, e vazio/"—" quando ausentes.
- **FR-006**: No fluxo de criação, a usuária MUST NOT informar o número do contrato; o número atribuído pelo sistema MUST ser refletido ao concluir a criação.
- **FR-007**: O fluxo de criação MUST permitir escolher a **classificação (Contrato/Ordem de Serviço)** e registrá-la no contrato criado.
- **FR-008**: Os **dois modos** de cadastro existem no **sistema** por meio de **dois fluxos** (refinamento D7, pós-leitura do código): (a) **criar como rascunho** (`mode: Pending`) e (b) **cadastro + assinatura** via o fluxo de 2 passos já existente (criar → **anexar documento assinado / ativar**). O **formulário de criação permanece Pending-only** nesta fatia; não há criação single-step `Active`.
- **FR-009**: A obrigatoriedade da **data de assinatura** pertence ao **fluxo de ativação/anexo de documento** (já existente), não ao formulário de criação desta fatia.
- **FR-010**: Os metadados de cadastro **enviados na criação** nesta fatia: **programa** (UUID via seletor real), **categorização** e **centro de custo**. **Plano orçamentário** fica como **follow-up** (o backend #32 ainda não expõe listagem de planos para o seletor; o campo permanece opcional/sem opções reais).
- **FR-011**: A inclusão de contrato MUST continuar funcionando contra o backend atualizado (sem regressão): um contrato criado MUST ser salvo e aparecer no grid com o número real.
- **FR-012**: Erros do backend (na leitura e na criação) MUST continuar sendo apresentados como **mensagens amigáveis** ao usuário, sem expor detalhes técnicos (cadeia de erro existente preservada).
- **FR-013**: A feature MUST ser **aditiva**, sem regressão no grid, no detalhe, na criação, nem nos demais módulos do app.

### Key Entities *(include if feature involves data)*

- **Contrato (visão de leitura)**: identificação visível por **número** (`CT/OS NNNN/AAAA`) + **classificação** (Contrato/Ordem de Serviço); inclui **programa** (referência + sigla exibível), **plano orçamentário**, **categorização** e **centro de custo** como metadados de cadastro; demais atributos já existentes (objeto, valor, vigência, status) inalterados.
- **Programa (referência exibível)**: vínculo do contrato a um programa, representado por um identificador e uma **sigla** curta usada na coluna Programa do grid e no detalhe.
- **Contrato (intenção de criação)**: dados informados pela usuária para criar um contrato — **sem número** (atribuído pelo sistema), **com classificação** (CT/OS), **modo de cadastro** (rascunho vs cadastro+assinatura, com data de assinatura quando aplicável) e os metadados de cadastro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos contratos criados exibem o **número atribuído pelo sistema** — zero números inventados pelo app.
- **SC-002**: Contratos do tipo Contrato exibem prefixo **CT** e do tipo Ordem de Serviço exibem **OS**, conforme a classificação real (verificável criando um de cada).
- **SC-003**: A coluna **Programa** passa a exibir a sigla real para contratos com programa (deixa de ser "—" universal).
- **SC-004**: O fluxo de criação conclui com **sucesso** nos cenários válidos (rascunho e cadastro+assinatura) contra o backend atualizado — sem regressão de inclusão.
- **SC-005**: **Zero regressões** no grid, detalhe, criação e demais módulos — verificado por `pnpm verify` + `pnpm test:dom` e checagem em tela.

## Impacto Arquitetural *(frontend — web-app v2)*

> Esta spec é do repositório **web-app v2 (frontend)**, não do core-api. A seção do template voltada ao core-api é **N/A** aqui; abaixo, o equivalente para o front.

- **Toca core-api?** **Não.** Frontend-only; consome o contrato de API já entregue pelo #32. Nenhuma mudança em `../core-api`.
- **Módulo afetado**: `src/modules/contracts/` (server-adapters/schemas do BFF + client data/view-model/ui de grid, detalhe e criação). Sem cruzar fronteiras para outros módulos.
- **Fronteira client↔server**: mantida nas **server functions** (única fronteira); validação **Zod na borda** (input da server fn + response do core-api).
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`; imutabilidade; design system **só-tokens** (`vars.*`); strings de UI = **tags i18n**; **views burras** (page/component sem `useQuery`/`useMutation`); boundaries por `public-api`; naming por postfix.
- **Possíveis riscos**: mudança de contrato de criação (novo body com `mode` e sem número) pode quebrar inclusão se o ajuste do create não acompanhar a leitura — por isso US1 inclui leitura **e** create na mesma fatia P1.

## Assumptions

- O backend do **#32** (`feat/backlog-front-handoff`) está disponível localmente e é a **referência do contrato de API** desta feature (número gerado por ano; `classification` CT/OS; bloco `program` com sigla; novo body de criação com discriminador de modo cadastro vs cadastro+assinatura e **sem** número).
- O formulário de criação **já coleta** programa, plano orçamentário, categorização e centro de custo; o trabalho de create concentra-se em **alinhar o envio** ao novo formato (modo + classificação + sem número), não em criar campos novos de UI.
- A **classificação CT/OS** é selecionável na criação (com Contrato como padrão), refletindo o campo de classificação já presente no cadastro/detalhe.
- O **banco local está limpo**; dados de teste (contratos com e sem programa) serão criados para validação em tela.
- O #32 ainda **não está mergeado no `dev`**; quando mergear, o ambiente local volta para a imagem de `dev`. A feature assume o contrato do #32 e não depende de detalhes só dessa branch além do que vira `dev` no merge.
- Os slices **fora de escopo** (cancelamento/status `Cancelled`, motivo do distrato, `signedAt` do aditivo, avaliação de fornecedor, `GET /partner-municipalities/added`) serão tratados em specs separadas.
