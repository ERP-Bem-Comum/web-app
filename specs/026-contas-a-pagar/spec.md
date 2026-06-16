# Feature Specification: Contas a Pagar (módulo Financeiro) — v1 núcleo

**Feature Branch**: `feat/contas-a-pagar-026`

**Created**: 2026-06-15

**Status**: Draft

**Input**: Submódulo **Contas a Pagar** do módulo **Financeiro** (front v2). Greenfield (sem legado — o legado vale só para Contas a Receber). Consome o backend novo `/api/v2/financial` do core-api (#38), Document-cêntrico, em "Fatia 1" (parcial). Escopo travado pela usuária no **núcleo que funciona** (criar/aprovar/cancelar); a listagem é apenas o shell (backend stub vazio).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lançar um documento fiscal (Conta a Pagar) (Priority: P1)

Como **operador financeiro**, quero registrar um documento fiscal (NFS-e, RPA, Fatura, Boleto, etc.) de um fornecedor para que o sistema gere a(s) obrigação(ões) de pagamento correspondente(s). Ao confirmar, o sistema cria o **título pai** (no valor líquido) e, quando houver retenções, **um título filho por retenção**.

**Why this priority**: É o coração do submódulo e o único fluxo com backend totalmente funcional. Entrega valor imediato: registrar contas a pagar. Sem ele, o módulo não tem propósito.

**Independent Test**: Abrir "Novo documento", preencher os campos obrigatórios (tipo, número, fornecedor, forma de pagamento, valor bruto, vencimento), opcionalmente retenções, e confirmar — o sistema persiste o documento como **Aberto** e exibe os títulos gerados (pai + filhos).

**Acceptance Scenarios**:

1. **Given** um operador na página "Lançar Documento" com fornecedor selecionado e valores válidos, **When** confirma um documento **NFS-e** com uma retenção de ISS, **Then** o sistema cria o documento no estado **Aberto** e apresenta **1 título pai** (valor líquido) **+ 1 título filho** (valor da retenção de ISS).
2. **Given** um documento sem retenções, **When** confirma, **Then** é criado apenas o **título pai** no valor líquido.
3. **Given** valores cujo **líquido resultaria ≤ 0**, **When** tenta confirmar, **Then** o sistema impede e exibe mensagem clara de "valor líquido deve ser positivo" (não um código técnico).
4. **Given** um tipo de documento que **não** é NFS-e nem RPA, **When** o operador abre o formulário, **Then** o bloco de **retenções fica indisponível** (e, se enviado, o backend recusa com mensagem clara).
5. **Given** falta o **vencimento**, **When** tenta confirmar, **Then** o sistema sinaliza o campo obrigatório (mensagem de "documento incompleto").

---

### User Story 2 - Acessar o módulo e ver o grid de Contas a Pagar (Priority: P2)

Como **usuário do Financeiro**, quero acessar Financeiro → Contas a Pagar e ver a tela de listagem (grid) como ponto de entrada, com o botão "Novo documento", para navegar ao lançamento.

**Why this priority**: É o shell de navegação e a porta de entrada do US1. Tem valor de orientação mesmo antes de a listagem real existir, mas depende de backend que ainda não retorna dados (Fatia 1).

**Independent Test**: Navegar pelo menu até Contas a Pagar e ver o grid renderizado com suas colunas e um **estado vazio** honesto, além do botão "Novo documento" que leva à página de lançamento.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com permissão de leitura, **When** acessa Financeiro → Contas a Pagar, **Then** vê o grid com cabeçalhos de coluna e, como o backend ainda não retorna registros, um **estado vazio** ("nenhum documento") — **não** uma mensagem de erro.
2. **Given** o grid aberto, **When** clica em "Novo documento", **Then** é direcionado à página "Lançar Documento".
3. **Given** um usuário **sem** permissão de leitura do financeiro, **When** tenta acessar, **Then** vê uma mensagem de acesso negado (sem expor detalhe técnico).

---

### User Story 3 - Conduzir o ciclo de vida do documento (aprovar, ajustar, cancelar) (Priority: P3)

Como **aprovador financeiro**, quero aprovar, desfazer aprovação, ajustar ou cancelar um documento, respeitando os estados e a separação de funções (quem lança pode não poder aprovar).

**Why this priority**: Completa o núcleo funcional do backend. Depende de US1 (haver um documento) e de uma tela/área de detalhe para hospedar as ações.

**Independent Test**: Sobre um documento **Aberto** existente, executar cada ação e observar a transição de estado e as regras (ex.: aprovar leva a **Aprovado**; cancelar remove; ajustar regenera os títulos filhos).

**Acceptance Scenarios**:

1. **Given** um documento **Aberto** e um usuário com permissão de aprovação, **When** aprova, **Then** o documento e seus títulos passam a **Aprovado**.
2. **Given** um documento **Aprovado**, **When** o aprovador desfaz a aprovação, **Then** volta a **Aberto**.
3. **Given** um documento **Aprovado**, **When** alguém tenta ajustá-lo, **Then** o sistema impede (documento aprovado é imutável; editar exige desfazer a aprovação antes).
4. **Given** um documento **Aberto**, **When** é cancelado, **Then** o documento e seus títulos são removidos (cancelamento é definitivo).
5. **Given** um operador **sem** permissão de aprovação, **When** vê um documento, **Then** as ações de aprovar/desfazer **não** estão disponíveis para ele.
6. **Given** um documento ajustado (mudança de retenções), **When** o ajuste é salvo, **Then** os títulos filhos são **regenerados** conforme as retenções atuais.

---

### Edge Cases

- **Líquido ≤ 0**: bloqueio com mensagem "o valor líquido deve ser positivo".
- **Retenção em tipo não permitido** (qualquer tipo ≠ NFS-e/RPA): bloqueio na UI (bloco indisponível) e, em última instância, mensagem do backend.
- **Transição inválida** (ex.: aprovar um já aprovado, cancelar um aprovado, ajustar um não-aberto): mensagem "operação não permitida para o estado atual".
- **Documento inexistente** (id inválido): mensagem "documento não encontrado".
- **Grid sem dados** (backend stub na Fatia 1): **estado vazio**, nunca erro.
- **Sessão expirada / sem permissão**: redirecionamento de login / mensagem de acesso negado, conforme a cadeia padrão.
- **Falha de conectividade/servidor**: mensagem amigável de indisponibilidade temporária, sem expor detalhe interno.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer navegação Menu → Financeiro → Contas a Pagar, abrindo o **grid** como tela inicial do submódulo.
- **FR-002**: O grid MUST apresentar colunas para os dados de listagem do documento (identificação/número, tipo, fornecedor, valor líquido, vencimento, situação) e um **estado vazio** explícito enquanto o backend não retornar registros (Fatia 1). Não pode tratar lista vazia como erro.
- **FR-003**: O grid MUST oferecer a ação "Novo documento", que direciona à página "Lançar Documento".
- **FR-004**: A página "Lançar Documento" MUST permitir informar: tipo do documento, número, série (opcional), fornecedor, vínculos opcionais (contrato/programa/plano/categoria), forma de pagamento, valor bruto, componentes opcionais de valor (descontos na fonte, descontos, multa, juros), retenções, impostos registrados, data de vencimento e descrição.
- **FR-005**: O sistema MUST aceitar valores monetários em reais na entrada e tratá-los com a precisão exigida pelo backend (inteiros em centavos), e alíquotas de retenção como percentual, convertendo para a unidade do backend (basis points).
- **FR-006**: O sistema MUST permitir retenções **apenas** para documentos NFS-e e RPA; para os demais tipos, o bloco de retenções fica indisponível.
- **FR-007**: Ao confirmar o lançamento, o sistema MUST criar o documento e exibir o resultado dos **títulos gerados** (pai = líquido; um filho por retenção).
- **FR-008**: O sistema SHOULD apresentar uma **prévia do valor líquido** (bruto − descontos na fonte − retenções − descontos + multa + juros) e MUST impedir a confirmação se o líquido não for positivo.
> **Faseamento (v1):** FR-009 a FR-011 têm a **camada server/client pronta no v1** (server fns + repository), mas a **superfície de UI** dessas ações desce na **onda 2** (drawer) — ver "Fora de escopo".

- **FR-009**: O sistema MUST permitir, sobre um documento existente, as ações de **ajustar** (somente quando Aberto), **aprovar** (Aberto → Aprovado), **desfazer aprovação** (Aprovado → Aberto) e **cancelar** (somente quando Aberto, removendo definitivamente). *(v1: server/client pronto; UI na onda 2.)*
- **FR-010**: O sistema MUST refletir a **separação de funções**: ações de aprovação só ficam disponíveis para quem tem a permissão de aprovação, distinta da permissão de lançamento. *(v1: guard no servidor; degradação de UI na onda 2.)*
- **FR-011**: O sistema MUST tratar documento **Aprovado como imutável**: a edição exige desfazer a aprovação antes. *(v1: regra no servidor; UI de edição na onda 2.)*
- **FR-012**: O sistema MUST traduzir todos os erros de negócio em **mensagens claras ao usuário** (cadeia de erro fim-a-fim), sem nunca expor status HTTP ou jargão técnico.
- **FR-013**: O sistema MUST exigir as permissões corretas por ação (ler, lançar/ajustar, aprovar/desfazer, cancelar). No **v1**: o **gating de menu/rota** por permissão (`fiscal-document:read` para acessar; `fiscal-document:write` para lançar) entra; a **degradação fina por ação** (esconder/desabilitar aprovar/cancelar) desce na **onda 2** com a UI de ciclo de vida.

### Key Entities *(include if feature involves data)*

- **Documento Fiscal**: o fato gerador da conta a pagar. Atributos: tipo (NFS-e, DANFE, RPA, Fatura, Boleto, Recibo, Imposto), número/série, fornecedor, vínculos opcionais (contrato/programa/plano/categoria), forma de pagamento, valor bruto e componentes (descontos na fonte, descontos, multa, juros), retenções, impostos registrados, vencimento, descrição, **situação** (Rascunho, Aberto, Aprovado) e **valor líquido** calculado.
- **Título (a pagar)**: obrigação financeira gerada do documento. Dois tipos: **pai** (1 por documento, valor = líquido) e **filho** (1 por retenção retida; **CSRF agrega PIS+COFINS+CSLL**). Situação-alvo com 7 estados (Rascunho, Aberto, Aprovado, Transmitido, Recusado, Pago, Conciliado) — **só 3 vivos na Fatia 1**. Não é parcelamento.
- **Retenção**: imposto que **abate do líquido e gera título filho**. Tipos: ISS, IRRF, INSS, CSRF. Atributos: base, alíquota, valor.
- **Imposto registrado**: imposto apenas **registrado** (não abate do líquido nem gera filho). Tipos: ICMS, IPI, PIS, COFINS, CBS, IBS Municipal, IBS Estadual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador consegue lançar um documento fiscal válido (com e sem retenção) e ver os títulos gerados em **menos de 3 minutos**, sem ajuda.
- **SC-002**: **100%** dos erros de negócio (líquido não positivo, retenção indevida, transição inválida, documento incompleto, não encontrado, sem permissão) aparecem como **mensagem compreensível**, sem nenhum código HTTP ou texto técnico visível.
- **SC-003**: O bloco de retenções aparece **somente** para NFS-e e RPA em **100%** dos casos.
- **SC-004**: A separação de funções é respeitada: um usuário sem permissão de aprovação **nunca** consegue aprovar/desfazer (ação ausente da UI e recusada na borda).
- **SC-005**: Acessar o submódulo com a lista vazia nunca produz erro — o usuário vê um **estado vazio** orientativo em **100%** dos acessos enquanto o backend estiver em Fatia 1.
- **SC-006**: A prévia do valor líquido exibida na UI coincide com o líquido calculado pelo backend para os mesmos dados.

## Impacto Arquitetural (front v2) *(adaptado do core-api → este é o repo de frontend)*

> Esta feature toca **apenas** `src/` do **frontend** (web-app). **Nenhuma alteração no core-api** — consome o módulo `/api/v2/financial` já existente (#38). A seção original do template (BCs `*_*`, outbox, Drizzle, CLI) é do core-api e **não se aplica** aqui.

- **Novo módulo vertical no front**: `src/modules/financial/` (Contas a Pagar), espelhando a feature-modelo `src/modules/auth/`: split `server/` (domain → application → adapters; a **server function** é a única fronteira com o core-api) × `client/` (data → view-model → ui burra) + `public-api/index.ts`.
- **Fronteira única**: o browser nunca fala com o core-api direto — só via **server functions (BFF)**. Validação Zod no input da server fn **e** no response do core-api.
- **Erros como valores** (`Result`), sem `throw` fora da borda; `QueryError` só na ponte com o TanStack Query. Cadeia de erro slug → `AppError.kind` → tag i18n.
- **Design system tokens-only** (`vars.*`), **strings de UI = i18n**, server-state no TanStack Query e UI-state em máquina de estado.
- **Backend**: nenhum novo agregado/evento/CLI no core-api. Dependência do contrato `/api/v2/financial` **como está na Fatia 1** (ver Assumptions).

## Assumptions

- **Fonte de verdade**: o modelo é regido pela **documentação revisada do módulo** em `core-api/specs/FIN-DOCUMENTO-INGESTAO/` (`domain.md`, `data-model.md`, `contracts/`) **e** pelo código real (`core-api/src/modules/financial/`). Onde o **design (mock/Figma)** for além disso, backend + documentação **vencem**.
- **Títulos = Pai + Filhos-por-retenção (SEM parcelamento)** — confirmado no `domain.md` (R4/R8): o documento gera **1 título pai (líquido) + 1 filho por retenção**; **CSRF agrega PIS+COFINS+CSLL num único filho**. NFS-e → pai + até 4 filhos (ISS, IRRF, INSS, CSRF); RPA → pai + 3 (IRRF, INSS, CSRF); demais tipos → só o pai. O "Parcela 1/3…" do mock **não é parcelamento** — leia-se como os títulos filhos (impostos retidos).
- **Documentação = visão-alvo; código Fatia 1 = subconjunto disponível**: a doc/design descrevem o modelo completo (7 status, categorização rica, OCR/divergências, drawer). A **Fatia 1** entrega só criar/ajustar/aprovar/desfazer/cancelar + detalhe-por-id; **lista é stub**, **DTO fino**, **3 status vivos** (Rascunho/Aberto/Aprovado). O front v1 constrói contra a Fatia 1, com os **tipos modelados rumo ao alvo** (crescem sem reescrita).
- **Colunas do grid são legítimas, mas a lista não as expõe ainda**: as colunas do design (Tipo, Documento+série, Fornecedor+CNPJ, Contrato, Forma Pag., Emissão, Vencimento, Bruto, Líquido, Status) existem no **data-model documentado** (`fin_documentos`), mas o **DTO da lista na Fatia 1 é fino** (só id/status/número/tipo/supplierRef/líquido/vencimento). → **ticket de backend `FIN-LIST-DTO`** (enriquecer a lista) para a Fatia 2; até lá, grid = shell + estado vazio.
- **Backend em "Fatia 1" (Document-cêntrico)** — fronteiras de escopo aceitas pela usuária:
  - A **listagem** (`GET /financial/documents`) é **stub** e retorna vazio: o grid é só o shell + estado vazio nesta versão; a listagem real chega na Fatia 2 do backend.
  - **Não há rota de "enviar rascunho"** e o cadastro exige os campos principais mesmo como rascunho → **rascunho/autosave parcial fica fora do v1**.
  - **Controle de concorrência (optimistic lock)** não é aplicado pelo backend (o campo de versão é exigido mas não verificado) → o front envia o exigido, mas não promete detecção de conflito.
  - O **detalhe** retornado é enxuto (não traz séries, vínculos, componentes de valor detalhados, nem quem/quando aprovou) → a tela de detalhe exibe o que o contrato fornece hoje.
- **Telas prontas**: o **grid** e a **página de lançamento** já existem como design e serão fornecidos na fase de UI; a área/tela de **detalhe** que hospeda as ações de ciclo de vida (US3) também terá design a fornecer.
- **Seleção de fornecedor e vínculos**: o fornecedor (obrigatório) é escolhido a partir dos dados já existentes de Parceiros/Fornecedores; vínculos opcionais (contrato/programa) reutilizam os módulos existentes; "plano orçamentário" e "categoria" podem não ter fonte de dados pronta no front e, se necessário, ficam adiados ou como seleção simples até haver catálogo.
- **Localização**: moeda em BRL e textos em pt-BR; datas exibidas no fuso local, trafegadas como data simples (sem hora).
- **Estados reservados** (Transmitido, Recusado, Pago, Conciliado) existem no domínio do backend mas **não** têm transição na Fatia 1 → **fora** do v1 (são de Conciliação/pagamento, outro submódulo).

### Fora de escopo (v1)

- Submódulos **Contas a Receber** (legado) e **Conciliação**.
- Listagem com dados reais, filtros e paginação efetivos (dependem da Fatia 2 do backend + `FIN-LIST-DTO`).
- **"Filtro Adicionar" + "Visões Salvas"** — por decisão da usuária, são a **última coisa de todo o módulo** (depois de Contas a Pagar/Receber/Conciliação).
- **Busca, ordenação e contadores das abas de status** (Todos/Rascunho/Em Aberto/Aprovado/Pago) — dependem da lista real (Fatia 2).
- **Seleção em massa + "Mudar Status" em lote + "Exportar" (PDF/CSV/CNAB)** — Fatia 2+ (sem endpoint de lote nem export; CNAB depende de remessa bancária).
- **Corpo do Drawer de detalhes** ("onda 2", marcado pelo próprio design) e as **ações de ciclo de vida (US3) hospedadas nele** — o backend suporta aprovar/cancelar/ajustar, mas a superfície de UI desce junto com o drawer; no v1 entra grid shell + Lançar Documento.
- Fluxo de rascunho → envio (sem rota de submit), autosave, e edição rica de detalhe.
- Fluxos de pagamento/baixa/transmissão/conciliação (estados reservados Transmitido/Recusado/Pago/Conciliado).
