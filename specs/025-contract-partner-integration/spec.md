# Feature Specification: Integração Parceiros × Contratos (dados do contratado, ACT no grid, máscara, novo parceiro, auto-PIX)

**Feature Branch**: `feat/contract-partner-integration-025`

**Created**: 2026-06-11

**Status**: Draft

**Input**: Ajustes na integração entre o módulo de Parceiros e o de Contratos: exibir/pré-preencher os dados do contratado selecionado (banco/PIX/e-mail/telefone) na inclusão e no detalhe; tornar o contratado ACT visível no grid e no detalhe; máscara de telefone na seção Contato; "cadastrar novo parceiro" passando a direcionar ao módulo de parceiros e voltar; auto-preenchimento da chave PIX no cadastro de parceiro. Frontend-only, aditivo, sem tocar core-api, sem regressão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dados do contratado pré-preenchidos no contrato (Priority: P1)

Ao criar um contrato, depois de **selecionar o contratado** (fornecedor, colaborador, financiador ou ACT), os dados de pagamento e contato daquele parceiro são trazidos do cadastro do parceiro (quando existirem):
- **Dados bancários** (banco, agência, conta, dígito) e **chave PIX** (tipo + chave) são **pré-preenchidos para exibição, mas permanecem SOMENTE-LEITURA** no contrato (edição bloqueada, como já é hoje) — refletem o cadastro do parceiro, não se editam no contrato.
- **E-mail** e **telefone** (seção "Contato") são **pré-preenchidos e EDITÁVEIS**: o usuário pode ajustar antes de salvar.

Na **tela de detalhe** do contrato, esses dados do contratado (banco/PIX como leitura; contato) também ficam visíveis.

**Why this priority**: É o coração da integração pedida — evita redigitar dados que já existem no cadastro do parceiro e reduz erro. Entrega valor direto no fluxo mais usado (criar contrato).

**Independent Test**: Selecionar um contratado que tenha banco/PIX/e-mail/telefone preenchidos → banco/PIX aparecem preenchidos e **bloqueados** (somente leitura); e-mail/telefone aparecem preenchidos e **editáveis**; salvar e abrir o detalhe → os dados aparecem.

**Acceptance Scenarios**:

1. **Given** um parceiro com banco, PIX, e-mail e telefone preenchidos, **When** o usuário o seleciona como contratado, **Then** banco/PIX do contrato são preenchidos e ficam **somente-leitura** (não editáveis), e e-mail/telefone são preenchidos e **editáveis**.
2. **Given** os campos de Contato pré-preenchidos, **When** o usuário edita o e-mail/telefone e salva, **Then** o valor salvo é o editado (o pré-preenchimento não sobrepõe a edição do contato).
3. **Given** um parceiro sem alguns desses dados (ex.: sem PIX), **When** ele é selecionado, **Then** os campos sem dado ficam vazios (não quebram, não inventam valor).
4. **Given** um contrato salvo com dados do contratado, **When** o usuário abre o detalhe, **Then** banco/PIX (leitura) e contato do contratado são exibidos.
5. **Given** um contratado selecionado, **When** o usuário troca para outro contratado, **Then** os campos são re-preenchidos com os dados do novo parceiro (banco/PIX leitura; contato editável).

---

### User Story 2 - Contratado ACT visível no grid e no detalhe (Priority: P1)

Um contrato cujo contratado é um **ACT** (Acordo de Cooperação Técnica) deve mostrar o ACT como contratado no **grid de contratos** (nome/avatar/cor por tipo, como fornecedor/colaborador/financiador) e na **tela de detalhe**. Hoje o ACT não aparece (cai num fallback errado).

**Why this priority**: É um **bug** de dados faltando — contratos de ACT existem mas aparecem sem contratado, o que confunde e parece dado perdido.

**Independent Test**: Com um contrato cujo contratado é um ACT, o grid mostra o nome do ACT na coluna de contratado (com o estilo do tipo ACT) e o detalhe mostra o ACT como contratado.

**Acceptance Scenarios**:

1. **Given** um contrato com contratado ACT, **When** o usuário vê o grid de contratos, **Then** a linha mostra o ACT como contratado (nome + estilo do tipo ACT), igual aos demais tipos.
2. **Given** um contrato com contratado ACT, **When** o usuário abre o detalhe, **Then** o ACT é exibido como contratado.
3. **Given** contratos de todos os tipos (fornecedor/colaborador/financiador/ACT), **When** vistos no grid, **Then** todos exibem o contratado corretamente (sem regressão nos outros tipos).

---

### User Story 3 - Máscara de telefone na seção Contato (Priority: P1)

Na **inclusão** de contrato (seção "Contato") e na **edição** do detalhe, o campo de telefone aplica máscara de telefone brasileiro enquanto o usuário digita — formato `(xx) xxxxx-xxxx` (celular) ou `(xx) xxxx-xxxx` (fixo) — igual aos formulários de parceiros.

**Why this priority**: Consistência e legibilidade; baixo esforço, alto polimento. Hoje o telefone é um campo cru.

**Independent Test**: Digitar números no campo de telefone (inclusão e detalhe) → o valor é formatado com a máscara; salvar mantém o telefone correto.

**Acceptance Scenarios**:

1. **Given** o campo de telefone na inclusão de contrato, **When** o usuário digita 11 dígitos, **Then** o valor exibido fica `(xx) xxxxx-xxxx`.
2. **Given** o campo de telefone no detalhe (modo edição), **When** o usuário digita, **Then** a mesma máscara é aplicada.
3. **Given** um telefone com máscara, **When** o contrato é salvo, **Then** o telefone é persistido corretamente (sem caracteres da máscara quebrarem o dado).

---

### User Story 4 - "Cadastrar novo parceiro" direciona ao módulo e volta (Priority: P2)

Na inclusão de contrato, ao não encontrar o parceiro no seletor de contratado, o usuário aciona **"cadastrar novo parceiro"**. O sistema o **direciona ao módulo de parceiros** (na mesma aba), onde ele escolhe o tipo e faz o cadastro; ao concluir, o sistema o **traz de volta** à inclusão de contrato para seguir registrando.

**Why this priority**: Hoje a ação está **quebrada** (abre uma URL inexistente em nova aba, sem retorno). Conserta um fluxo real, mas é P2 por ser menos frequente que US1–US3.

**Independent Test**: Na inclusão de contrato, acionar "cadastrar novo parceiro" → cai no módulo de parceiros (mesma aba); cadastrar um parceiro → retorna à inclusão de contrato.

**Acceptance Scenarios**:

1. **Given** a inclusão de contrato, **When** o usuário aciona "cadastrar novo parceiro", **Then** é direcionado ao módulo de parceiros na mesma aba (sem URL quebrada / sem nova aba).
2. **Given** que o usuário chegou ao módulo de parceiros por esse caminho, **When** ele cadastra um parceiro com sucesso, **Then** é levado de volta à inclusão de contrato.
3. **Given** o retorno à inclusão de contrato, **Then** o formulário está em branco (sem preservar rascunho — comportamento acordado) e o parceiro recém-criado pode ser selecionado como contratado.

---

### User Story 5 - Auto-preenchimento da chave PIX no cadastro de parceiro (Priority: P2)

No cadastro de parceiro, ao escolher o **tipo de chave PIX**, se o tipo for **CPF/CNPJ, e-mail ou telefone** e esse dado **já estiver preenchido** no formulário (documento, e-mail, telefone), o campo **"chave PIX"** é **auto-preenchido** com esse valor — de forma **editável**. O comportamento é **desenhado para os cadastros de todos os tipos de parceiro** (Colaborador, Fornecedor, Financiador e ACT); fica **ativo onde o PIX está habilitado** — hoje **Fornecedor** e **ACT** — e passa a valer para **Colaborador e Financiador quando o backend liberar** os campos bancários/PIX (ticket `PAR-FINANCIER-COLLAB-BANK`). O helper de derivação é único/genérico, então destravar os outros dois é só ligá-lo.

**Why this priority**: Conveniência que reduz redigitação; depende de campos já existentes. P2 por ser um detalhe de formulário.

**Independent Test**: No cadastro de fornecedor/ACT (formulários com PIX habilitado), com documento/e-mail preenchidos, selecionar o tipo de chave PIX correspondente → a chave é preenchida com o valor; o usuário pode editar. (Em Colaborador/Financiador o mesmo vale assim que o backend liberar banco/PIX.)

**Acceptance Scenarios**:

1. **Given** documento preenchido, **When** o usuário escolhe tipo de chave PIX = CPF/CNPJ, **Then** a chave PIX é preenchida com o documento (editável).
2. **Given** e-mail/telefone preenchidos, **When** o tipo de chave é e-mail/telefone, **Then** a chave é preenchida com o valor correspondente (editável).
3. **Given** o tipo de chave = aleatória (random), ou o dado correspondente vazio, **When** selecionado, **Then** a chave **não** é auto-preenchida (fica como está / vazia).
4. **Given** uma chave PIX já editada manualmente, **When** o usuário troca o tipo de chave, **Then** o comportamento prioriza não destruir uma edição intencional do usuário (detalhe de regra a confirmar no plano).

---

### Edge Cases

- **US1**: parceiro cujo detalhe falha ao carregar (erro/timeout) → a seleção do contratado continua válida; os campos simplesmente não são pré-preenchidos e o usuário pode preencher manualmente (sem travar o fluxo).
- **US1**: trocar de contratado depois de ter editado os campos manualmente → re-preenche com o novo parceiro (a troca de contratado reflete o novo parceiro).
- **US2**: contratos antigos sem contratado, ou com tipo desconhecido → não quebram o grid/detalhe (degradam com segurança).
- **US3**: telefone incompleto / colado com formatação → a máscara normaliza; o valor salvo são só os dígitos.
- **US4**: usuário cancela o cadastro do parceiro ou navega para outro tipo dentro do módulo → o retorno funciona quando ele conclui um cadastro pela entrada com retorno; navegação livre dentro do módulo pode não trazer o retorno (aceitável no recorte "voltar simples").
- **US5**: PIX de colaborador/financiador está indisponível (gated) → o auto-preenchimento não se aplica a eles (fora de escopo até o backend liberar).

## Requirements *(mandatory)*

### Functional Requirements

**US1 — Dados do contratado**
- **FR-001**: Ao selecionar um contratado na inclusão de contrato, o sistema MUST obter os dados de pagamento/contato do parceiro (banco, PIX, e-mail, telefone) a partir do cadastro do parceiro.
- **FR-002**: O sistema MUST **pré-preencher** os campos de **banco e PIX** do contrato com os dados do parceiro, mantendo-os **SOMENTE-LEITURA** (edição bloqueada, como hoje) — não são editáveis no contrato.
- **FR-002b**: O sistema MUST **pré-preencher** os campos de **e-mail e telefone** (seção Contato) e mantê-los **EDITÁVEIS**.
- **FR-003**: O sistema MUST preencher apenas os campos para os quais o parceiro tem dado; campos sem dado permanecem vazios.
- **FR-004**: Trocar o contratado MUST re-preencher os campos com os dados do novo parceiro.
- **FR-005**: A tela de detalhe do contrato MUST exibir banco/PIX/e-mail/telefone do contratado quando existirem.
- **FR-006**: Falha ao obter o detalhe do parceiro MUST NOT impedir a seleção do contratado nem travar o formulário (degrada para preenchimento manual).

**US2 — ACT no grid/detalhe**
- **FR-007**: O grid de contratos MUST exibir o contratado do tipo **ACT** (nome + estilo do tipo), como os demais tipos.
- **FR-008**: A tela de detalhe MUST exibir o contratado quando ele for um ACT.
- **FR-009**: As mudanças MUST NOT regredir a exibição dos contratados dos outros tipos (fornecedor/colaborador/financiador).

**US3 — Máscara de telefone**
- **FR-010**: O campo de telefone na seção Contato (inclusão e detalhe) MUST aplicar máscara de telefone brasileiro durante a digitação.
- **FR-011**: O telefone MUST ser persistido de forma consistente (sem que os caracteres de máscara corrompam o dado).

**US4 — Novo parceiro com retorno**
- **FR-012**: A ação "cadastrar novo parceiro" MUST direcionar o usuário ao módulo de parceiros **na mesma aba** (sem URL inválida, sem nova aba).
- **FR-013**: Ao concluir o cadastro do parceiro (a partir desse fluxo), o sistema MUST retornar o usuário à inclusão de contrato.
- **FR-014**: O retorno MUST levar a um formulário de contrato em branco (sem preservar rascunho), com o parceiro recém-criado disponível para seleção.

**US5 — Auto-PIX**
- **FR-015**: No cadastro de parceiro, ao escolher tipo de chave PIX = CPF/CNPJ, e-mail ou telefone, o sistema MUST auto-preencher a chave com o valor do campo correspondente (documento/e-mail/telefone) já preenchido no formulário, de forma **editável**. O comportamento usa um helper único e vale para todos os tipos; está **ativo** nos forms com PIX habilitado (**Fornecedor e ACT** hoje) e passa a valer para **Colaborador e Financiador** quando o backend liberar banco/PIX.
- **FR-016**: Para tipo de chave aleatória ou quando o dado correspondente está vazio/inexistente no formulário, o sistema MUST NOT auto-preencher (chave fica vazia).

**Transversais**
- **FR-017**: Toda comunicação com o backend MUST passar pela fronteira única do app (server function/BFF); contratos consomem o detalhe do parceiro pela API pública do módulo de parceiros (sem acoplar internamente).
- **FR-018**: As mudanças MUST ser aditivas, sem regressão nos fluxos existentes (criação/edição/detalhe/grid de contratos; cadastros de parceiros).

### Key Entities *(include if feature involves data)*

- **Contratado (parceiro selecionado)**: o parceiro vinculado ao contrato. Tipos: fornecedor, colaborador, financiador, ACT. Atributos relevantes: nome, documento, e-mail, telefone, dados bancários (banco/agência/conta/dígito), chave PIX (tipo + chave).
- **Contrato (campos de pagamento/contato)**: dados bancários e PIX (pré-preenchidos a partir do contratado, **somente-leitura** no contrato) + e-mail e telefone (pré-preenchidos e **editáveis**).
- **Chave PIX (no cadastro de parceiro)**: tipo (CPF/CNPJ, e-mail, telefone, aleatória) + valor; o valor pode ser derivado do documento/e-mail/telefone do próprio cadastro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao selecionar um contratado com dados completos, **100%** dos campos disponíveis chegam pré-preenchidos sem redigitação — banco/PIX em **somente-leitura**, e-mail/telefone **editáveis**.
- **SC-002**: **100%** dos contratos com contratado ACT exibem o ACT no grid e no detalhe (nenhum aparece "sem contratado").
- **SC-003**: O telefone na seção Contato (inclusão e detalhe) é exibido com máscara em **100%** das digitações válidas.
- **SC-004**: A ação "cadastrar novo parceiro" leva ao módulo de parceiros e retorna à inclusão de contrato em **0 becos sem saída** (sem URL quebrada, sem nova aba órfã).
- **SC-005**: No cadastro de Fornecedor/ACT, escolher o tipo de chave PIX CPF/CNPJ, e-mail ou telefone preenche a chave com o valor correto em **1 ação** (a seleção do tipo), permanecendo editável.
- **SC-006**: **Zero regressão**: criação/edição/detalhe/grid de contratos e cadastros de parceiros seguem funcionando (verificado em tela + suíte de testes verde).

## Impacto Arquitetural *(frontend v2 — esta feature NÃO toca o core-api)*

- **Bounded Contexts (core-api) afetados**: **Nenhum.** Feature **frontend-only**; reusa endpoints existentes (detalhe de parceiro por tipo já consumido no módulo de parceiros). Sem mudança de agregados/eventos/CLI/HTTP no backend.
- **Módulos do front afetados**: `contracts` (inclusão, detalhe, grid) e `partners` (rotas/páginas de criação + forms de Fornecedor/ACT). O cruzamento contracts→partners ocorre **apenas via `partners/public-api`** (boundaries).
- **Fronteira client↔server**: a **server function (BFF)** continua sendo a única fronteira (detalhe de parceiro consumido por server fn já existente do módulo partners).
- **Invariantes v2 (lint cobra)**: `Result<T,E>` sem throw fora da borda; sem `any`/`class`/`this`; imutabilidade; só-tokens (`vars.*`); strings de UI = i18n; views burras (MVVM — sem `useQuery`/`useMutation` em page/component; estado de form no controller); boundaries por `public-api`; Zod na borda; naming por postfix; `switch` exaustivo com guard `never` (tipo de contratado: supplier/collaborator/financier/act).

## Assumptions

- **Detalhe de parceiro disponível por tipo**: o módulo de parceiros expõe (via `public-api`) o detalhe de cada tipo de parceiro com e-mail/telefone e, quando houver, dados bancários/PIX — consumível pela inclusão de contrato. (A confirmar no plano qual server fn por tipo usar; supplier/ACT têm banco/PIX; colaborador/financiador têm contato mas banco/PIX gated.)
- **Campos de pagamento/contato no contrato**: a inclusão de contrato já possui os campos de banco/PIX (hoje **desabilitados** — e devem permanecer assim) e de e-mail/telefone (editáveis). O pré-preenchimento alimenta banco/PIX para exibição (sem destravar a edição) e e-mail/telefone editáveis; o detalhe já tem onde exibi-los.
- **ACT como contratado**: o backend já aceita ACT como contratado (fatia 022) e o detalhe do contrato traz o contratado ACT; o gap é só de exibição no client (grid/detalhe).
- **Retorno via parâmetro de rota**: o padrão de retorno reusa o mecanismo já existente no login (parâmetro de redirecionamento seguro). "Voltar simples" = sem persistir rascunho do contrato.
- **PIX gated**: o auto-PIX é desenhado para os 4 tipos, mas **ativo** só onde o PIX está habilitado hoje (Fornecedor e ACT). Colaborador e Financiador têm banco/PIX **gated** (campos `disabled`, sem `pixKeyType`/`pixKey` no controller/model) aguardando o ticket `PAR-FINANCIER-COLLAB-BANK`; ao liberar, basta ligar o mesmo helper genérico (`document`/`email`/`telephone`). Esta fatia NÃO destrava colaborador/financiador (evita enviar campos que o backend ainda rejeita).
- **Fora de escopo**: mudanças no core-api; alterar o agregador de busca de parceiros; banco/PIX de colaborador/financiador; preservação de rascunho do contrato; tela nova de seleção de tipo de parceiro; foto de perfil/logo (bloqueados em outros tickets).
