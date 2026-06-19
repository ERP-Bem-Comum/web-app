# Feature Specification: Conciliação Bancária

**Feature Branch**: `034-bank-reconciliation`

**Created**: 2026-06-18

**Status**: Draft

**Input**: Módulo de Conciliação Bancária (Financeiro) — 2 telas espelhando o protótipo da consultoria (§9.4.x): grid de contas-cedente + workspace de conciliação. Front + BFF (server functions como única fronteira), consumindo o backend de conciliação do core-api (PR #152, issues #118–#125). UI 100% fiel aos mocks em `Desktop/CONSULTORIA/Financeiro/conciliacao/`.

## Clarifications

### Session 2026-06-18

- Q: Sem o backend de conta-cedente (#168), como o operador chega ao workspace para importar/conciliar agora? → A: **Seletor temporário de conta do seed** — um seletor simples lê uma conta-cedente já existente no backend (seed) para destravar o fluxo ponta-a-ponta; o grid de contas fica chrome honesto até #168.
- Q: As respostas de sugestões e de títulos Pagos não trazem nome do fornecedor / nº do documento. Como exibir o título? → A: **Exibir o mínimo** (documentId/valor/vencimento/forma) até o backend enriquecer (core-api#172); não resolver client-side por ora.
- Q: Exportar exige periodId, mas não há endpoint para listar períodos. Como habilitar o Exportar? → A: **Exportar fica como chrome** (desabilitado/anunciado) até o backend permitir obter o periodId (core-api#173); o fluxo de Fechar período funciona normalmente.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Conciliar uma transação por sugestão do sistema (Priority: P1)

O operador de tesouraria abre o workspace de uma conta, seleciona uma movimentação importada do extrato (ex.: um PIX enviado) e o sistema mostra a **sugestão de match** com um título Pago no sistema (lado a lado, com critérios: favorecido, valor, data, referência no memo) e um nível de confiança. O operador confirma a conciliação com um clique, ou rejeita a sugestão e vê outras possibilidades.

**Why this priority**: É o coração do módulo e o maior ganho de produtividade — fechar a conciliação no caminho feliz (1 transação ↔ 1 título) sem digitação. Entrega valor mesmo sem as demais histórias.

**Independent Test**: Com um extrato já importado e títulos Pagos no sistema, selecionar uma transação com sugestão de alta confiança, confirmar, e ver a transação marcada como conciliada (e some dos pendentes); rejeitar e ver as alternativas.

**Acceptance Scenarios**:

1. **Given** uma transação pendente com sugestão de alta confiança, **When** o operador clica em "Conciliar", **Then** a transação fica conciliada, sai da lista de pendentes e o progresso "conciliado X/N" aumenta.
2. **Given** a sugestão exibida, **When** o operador clica em "Rejeitar sugestão", **Then** a sugestão some, as "outras possibilidades" continuam disponíveis e a sugestão rejeitada não reaparece.
3. **Given** uma transação sem sugestão, **When** o operador a seleciona, **Then** o painel mostra que não há palpite e oferece "Nova transação" e "Buscar/Criar vários".

---

### User Story 2 - Importar extrato bancário (OFX/CSV) (Priority: P1)

O operador importa o extrato de uma conta (arquivo OFX ou CSV). O sistema processa, descarta duplicados (por identificador único da transação) e mostra quantas movimentações entraram e o período coberto. As novas movimentações aparecem na coluna de pendentes para conciliar.

**Why this priority**: Sem extrato importado não há o que conciliar — é o pré-requisito do fluxo. Depende da escolha de uma conta-cedente (ver Assumptions / dependência #168).

**Independent Test**: Selecionar uma conta, importar um OFX válido e ver o resumo (N importadas, M duplicadas descartadas, período) e as transações na lista; reimportar o mesmo arquivo e ver "0 importadas / N duplicadas".

**Acceptance Scenarios**:

1. **Given** uma conta selecionada, **When** o operador importa um OFX/CSV válido, **Then** o sistema mostra "{N} importadas · {M} duplicadas descartadas" e o período, e as transações aparecem na lista.
2. **Given** um arquivo mal formado ou de formato não suportado, **When** o operador tenta importar, **Then** o sistema exibe uma mensagem de erro clara e não altera os dados.
3. **Given** um período já fechado, **When** o operador tenta importar nele, **Then** o sistema bloqueia com aviso de "período fechado".

---

### User Story 3 - Conciliação N:1 e parcial (Buscar/Criar vários) (Priority: P2)

Quando uma transação corresponde a **vários títulos** (ex.: pagamento de 2 parcelas) ou quando o valor **não bate exatamente**, o operador usa a aba "Buscar/Criar vários": busca/seleciona múltiplos títulos Pagos, vê a soma comparada ao valor do extrato e, havendo diferença, classifica o tratamento (Juros, Multa, Desconto, Tarifa ou Parcial) antes de conciliar.

**Why this priority**: Cobre os casos reais que o match 1:1 não resolve. Importante, mas secundário ao caminho feliz.

**Independent Test**: Selecionar uma transação, marcar 2 títulos cuja soma bate com o extrato e conciliar (N:1); depois com soma diferente, classificar a diferença e conciliar parcial.

**Acceptance Scenarios**:

1. **Given** títulos selecionados cuja soma é igual ao valor do extrato, **When** o operador concilia, **Then** a conciliação N:1 é registrada e a transação fica conciliada.
2. **Given** a soma dos títulos difere do extrato, **When** o operador não classifica a diferença, **Then** o botão de conciliar fica bloqueado com aviso "classifique a diferença".
3. **Given** a diferença classificada (ex.: Juros), **When** o operador concilia, **Then** a conciliação parcial é registrada com o tratamento escolhido.

---

### User Story 4 - Lançamento manual de transação sem título (Priority: P2)

Para movimentações que não têm título correspondente no sistema (tarifa, aplicação, resgate, transferência entre contas, ou um pagamento avulso), o operador classifica a transação na aba "Nova transação": escolhe o tipo, e — para transferência/aplicação/resgate — informa a conta de destino com uma confirmação consciente (não é pagamento de fornecedor). A transação é conciliada como lançamento manual.

**Why this priority**: Necessário para "zerar" o extrato (todas as movimentações tratadas), mas menos frequente que o match.

**Independent Test**: Selecionar uma tarifa bancária, escolher "Tarifa/Multa/Juros", categorizar e registrar; selecionar uma transferência e confirmar a conta de destino + a confirmação consciente.

**Acceptance Scenarios**:

1. **Given** uma transação sem título, **When** o operador escolhe um tipo e registra, **Then** a transação fica conciliada como "lançamento manual".
2. **Given** o tipo Transferência/Aplicação/Resgate, **When** o operador não confirma a conta de destino + confirmação consciente, **Then** o registro fica bloqueado.

---

### User Story 5 - Desfazer conciliação (Priority: P2)

O operador pode desfazer uma conciliação já feita (transação conciliada por engano), opcionalmente registrando um motivo. A transação volta a "pendente" e o título volta a "Pago"; a operação fica na trilha de auditoria (o registro de conciliação é preservado como desfeito, nunca apagado).

**Why this priority**: Correção de erros é essencial para confiança no fechamento, mas é exceção.

**Independent Test**: Abrir uma transação conciliada (banner/modal de detalhes), desfazer e ver a transação voltar a pendente.

**Acceptance Scenarios**:

1. **Given** uma transação conciliada, **When** o operador desfaz, **Then** ela volta a pendente, o título volta a Pago e a conciliação fica registrada como "desfeita".
2. **Given** um período fechado, **When** o operador tenta desfazer uma conciliação dele, **Then** a ação é bloqueada com aviso.

---

### User Story 6 - Grid de contas (entrada do módulo) + adicionar conta (Priority: P3)

Ao acessar Conciliação pelo menu, o operador vê o **grid de contas-cedente**: cada conta com saldo, última atualização e situação de conciliação (N pendentes / Em dia / Encerrada), com busca, filtros (status) e ordenação, além de "Adicionar conta bancária". Clicar numa conta ativa abre o workspace daquela conta; conta encerrada não abre.

**Why this priority**: É a porta de entrada e a visão consolidada, mas **depende de backend ainda inexistente** (listar/criar conta-cedente, saldo e contagens — core-api#168). Entregue como UI fiel com chrome honesto até o backend.

**Independent Test**: Abrir Conciliação e ver o grid; filtrar por "Com pendências"; clicar numa conta e abrir o workspace; tentar abrir uma encerrada e ser impedido. (Com dados reais somente após #168.)

**Acceptance Scenarios**:

1. **Given** o grid de contas, **When** o operador filtra/ordena/busca, **Then** a lista responde conforme o critério.
2. **Given** uma conta encerrada, **When** o operador clica, **Then** o sistema não abre o workspace e avisa.
3. **Given** a ausência do backend de conta-cedente (#168), **When** a tela carrega, **Then** ela exibe estado honesto (sem inventar dados) e o "Adicionar conta" fica anunciado/desabilitado até o backend.

---

### User Story 7 - Fechar período e exportar conciliação (Priority: P3)

Após tratar todas as movimentações, o operador fecha o período da conta (bloqueando alterações retroativas) e/ou exporta a conciliação em OFX ou CSV (retorno bancário / planilha).

**Why this priority**: Fechamento e exportação são o desfecho do ciclo, mas vêm depois de conciliar.

**Independent Test**: Com todas as movimentações tratadas, fechar o período e ver o status "fechado"; exportar e baixar o arquivo OFX/CSV.

**Acceptance Scenarios**:

1. **Given** um período com pendências, **When** o operador tenta fechar, **Then** o sistema bloqueia com "há movimentações pendentes".
2. **Given** um período fechado, **When** o operador exporta em OFX/CSV, **Then** o arquivo é baixado.

---

### User Story 8 - Visualizar o extrato e filtrar por período (Priority: P3)

O operador alterna para a aba "Extrato" e vê o extrato completo da conta (entradas/saídas/saldo por dia), com filtros (todos/entradas/saídas/conciliados/pendentes) e filtro de período compartilhado com a conciliação.

**Why this priority**: Apoio à conferência; não é o fluxo principal de conciliar.

**Independent Test**: Abrir a aba Extrato, aplicar filtros e o período, e ver as linhas e totais corretos.

**Acceptance Scenarios**:

1. **Given** a aba Extrato, **When** o operador filtra por "Pendentes" e um período, **Then** a lista e os totais refletem o filtro.

---

### Edge Cases

- **Só "Pago" é conciliável**: a regra do backend permite conciliar apenas títulos no estado **Pago** (o protótipo exibe outros status; vale o código). Títulos não-Pagos não aparecem como conciliáveis.
- **Balanceamento**: a soma dos títulos + diferença classificada deve igualar o valor da transação; senão a conciliação é recusada.
- **Dedup de extrato**: reimportar um arquivo já importado descarta duplicados silenciosamente (por identificador único) — refletir no resumo, sem erro.
- **Período fechado**: importar, conciliar e desfazer ficam bloqueados em período fechado.
- **Transação já conciliada / conciliação já desfeita**: ações repetidas são rejeitadas com aviso.
- **Lote (best-effort)**: ao conciliar/classificar vários, falhas parciais não abortam o lote — o sistema reporta o que falhou.
- **Lacunas de backend (chrome honesto)**: sem o backend de conta-cedente (#168) não há seleção/listagem de conta nem saldo/contagens; importar **PDF via OCR** não existe (#145). Esses pontos aparecem desabilitados/anunciados, com a costura pronta para ligar quando o backend chegar.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um grid de contas-cedente (entrada do módulo) com busca, filtro por status (Todas/Com pendências/Em dia/Encerradas) e ordenação (pendências/saldo/nome/atualização), exibindo por conta: identidade (banco/agência/conta), última atualização, saldo e situação de conciliação.
- **FR-002**: O sistema MUST abrir o workspace de conciliação da conta ao selecioná-la no grid, e MUST impedir abrir contas encerradas.
- **FR-003**: O sistema MUST permitir importar extrato nos formatos **OFX e CSV**, exibindo após o processamento: nº importadas, nº duplicadas descartadas e o período coberto.
- **FR-004**: O sistema MUST descartar transações duplicadas na importação (por identificador único) sem erro e refletir isso no resumo.
- **FR-005**: O sistema MUST listar as movimentações importadas agrupadas por dia, com tipo (entrada/saída/transferência/tarifa/aplicação), valor, e indicador de palpite (alta/média/sem match/conciliado), e MUST permitir filtrar por Pendentes/Conciliadas/Todas.
- **FR-006**: O sistema MUST exibir, para a transação selecionada, a **sugestão de match** com título(s) Pago(s): comparação lado a lado, critérios atendidos e nível de confiança. Até o backend enriquecer a resposta (core-api#172), o título é exibido com o **mínimo disponível** (documento/valor/vencimento/forma); nome do fornecedor e nº do documento aparecem quando #172 entregar.
- **FR-007**: Usuários MUST poder **conciliar** uma transação com um título sugerido (1:1) e **rejeitar** uma sugestão (que não reaparece).
- **FR-008**: Usuários MUST poder conciliar uma transação com **vários títulos** (N:1), vendo a soma comparada ao valor do extrato.
- **FR-009**: Quando a soma não igualar o valor do extrato, o sistema MUST exigir a **classificação da diferença** (Juros/Multa/Desconto/Tarifa/Parcial) antes de permitir conciliar (conciliação parcial), e MUST bloquear a conciliação enquanto não balancear.
- **FR-010**: Usuários MUST poder registrar um **lançamento manual** para transações sem título (tipos: Pagamento, Recebimento, Transferência, Tarifa/Multa/Juros, Aplicação, Resgate), com categorização; para Transferência/Aplicação/Resgate o sistema MUST exigir conta de destino + confirmação consciente.
- **FR-011**: Usuários MUST poder **desfazer** uma conciliação (com motivo opcional), retornando transação a pendente e título a Pago, preservando o registro como "desfeito" (trilha de auditoria).
- **FR-012**: O sistema MUST permitir **conciliar em lote** a partir de várias transações com um mesmo modelo de classificação (best-effort, reportando falhas parciais).
- **FR-013**: Usuários MUST poder **fechar o período** de uma conta, sendo bloqueado se houver movimentações pendentes; após fechado, importar/conciliar/desfazer naquele período ficam bloqueados.
- **FR-014**: Usuários MUST poder **exportar a conciliação** do período em OFX e CSV (download de arquivo). Como não há endpoint para listar períodos/obter o `periodId` fora do fechamento, o **Exportar fica como chrome (desabilitado/anunciado)** até core-api#173; o fluxo de Fechar período funciona normalmente.
- **FR-015**: O sistema MUST oferecer a aba **Extrato** com a visão completa (entradas/saídas/saldo por dia) e filtros, compartilhando o filtro de período com a conciliação.
- **FR-016**: O sistema MUST oferecer um **filtro de período** e um **toggle "Exibir palpites"** que oculta/mostra as sugestões automáticas.
- **FR-017**: O sistema MUST exibir mensagens de erro claras e em PT-BR para as condições do backend (período fechado, não balanceado, título não-Pago, formato inválido, já conciliada/desfeita) sem expor detalhes internos.
- **FR-018**: A UI MUST replicar os mocks da consultoria com alta fidelidade, usando o design system do app (tokens-only), e MUST ser aditiva sem regressão no módulo de Contas a Pagar.
- **FR-019** _(chrome honesto / dependências)_: Onde o backend não existe, o sistema MUST apresentar a UI com estado desabilitado/anunciado, sem dados fabricados, deixando a costura (porta/gateway/server function) pronta para ligar. Dependências: **conta-cedente** listar/criar/saldo/contagens (core-api#168) — até lá, a seleção de conta no workspace usa um **seletor temporário de conta do seed** e o grid de contas é chrome; **enriquecimento** de sugestões/títulos com nome/nº doc (core-api#172) — exibir mínimo até lá; **listar períodos** p/ Exportar (core-api#173) — Exportar é chrome até lá; import **PDF via OCR** (core-api#145) — opção desabilitada.

### Key Entities _(include if feature involves data)_

- **Conta-cedente (Conta bancária)**: conta da organização para conciliar — banco, agência, conta-DV, apelido, tipo, status (ativa/encerrada), saldo. (Listagem/criação dependem de #168.)
- **Extrato (BankStatement)**: arquivo importado de uma conta num período; agrupa transações; tem período (início/fim).
- **Transação do extrato**: movimentação bancária — data, sentido (entrada/saída), tipo, favorecido, memo, valor, saldo após, identificador único (dedup), situação (pendente/conciliada/lançamento manual).
- **Título conciliável (Payable Pago)**: título no estado **Pago** elegível para vínculo — documento, valor, vencimento, forma de pagamento.
- **Sugestão de match**: vínculo proposto entre uma transação e um título, com score/confiança e critérios.
- **Conciliação**: vínculo confirmado (1:1, N:1 ou parcial), com tratamento de diferença opcional; estados ativo/desfeito; trilha de auditoria (quem/quando).
- **Período de conciliação**: janela (conta + intervalo) que pode ser fechada, bloqueando alterações.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Um operador consegue conciliar uma transação com sugestão de alta confiança em até **3 cliques** (selecionar → revisar → confirmar).
- **SC-002**: Importar um extrato e ver as movimentações prontas para conciliar leva menos de **1 minuto** (excluindo o tempo de processamento do backend).
- **SC-003**: Reimportar o mesmo arquivo **não cria duplicatas** (100% dos duplicados descartados, refletido no resumo).
- **SC-004**: É impossível concluir uma conciliação **desbalanceada** ou **fechar um período com pendências** (0 casos passam pela UI).
- **SC-005**: A tela reproduz o layout dos mocks com fidelidade visual alta (revisão visual aprovada) e **sem regressão** nos testes existentes (gates verdes).
- **SC-006**: Onde falta backend, a UI nunca exibe dados fabricados — os pontos bloqueados estão claramente anunciados (0 elementos "falsos" que enganem o operador).

## Impacto Arquitetural _(front + BFF — este repo NÃO altera o core-api)_

- **Bounded Contexts afetados**: Financeiro (`fin_*`) — **consumo** apenas; nenhuma mudança no core-api nesta feature.
- **Novo módulo no front**: `src/modules/financial/client/bank-reconciliation/` (ou submódulo do financeiro), espelhando o split client×server dos módulos existentes (data → view-model/binding/controller → ui; server fns como única fronteira).
- **Server functions (BFF)**: novas server fns que chamam o core-api (`/api/v2/financial/...`): import de extrato, listar transações, sugestões, conciliar/desfazer/rejeitar, lançamento manual, lote, fechar período, exportar, listar títulos Pagos.
- **Borda HTTP (core-api)**: já existe (PR #152) — esta feature **não** cria endpoints; apenas consome. Erros como valores (`Result`) ponta a ponta; validação Zod no input/response das server fns.
- **Dependências de backend (issues)**: **#168** (conta-cedente: listar/criar/saldo/contagem — bloqueia o grid e a seleção de conta), **#145** (import PDF via OCR). Sem essas, os pontos correspondentes são chrome honesto.
- **Possíveis violações da constituição**: nenhuma prevista — feature aditiva, tokens-only, sem `class`/`throw` fora da borda, server-state no TanStack Query.

## Assumptions

- **Conta-cedente via #168**: até o backend expor listar/criar conta-cedente (e saldo/contagens), o **grid de contas** é UI fiel com chrome honesto, e a **seleção de conta no workspace** usa um **seletor temporário que lê uma conta-cedente do seed** (para destravar import/conciliação ponta-a-ponta agora). A costura (porta/gateway/server fn) já fica pronta para o seletor real do grid quando #168 entregar.
- **Exibição de título = mínimo até #172**: o match card e o grid de títulos mostram só o que a API dá (documento/valor/vencimento/forma); nome do fornecedor e nº do documento entram quando core-api#172 enriquecer a resposta.
- **Exportar = chrome até #173**: sem endpoint para obter o `periodId` fora do fechamento, o Exportar OFX/CSV fica desabilitado/anunciado até core-api#173 (listar períodos). Fechar período funciona.
- **Só "Pago" é conciliável**: a lista de títulos conciliáveis usa `GET /payables?status=Paid`; o protótipo mostra outros status, mas vale a regra do código.
- **Dinheiro em centavos (string)**; datas ISO; valores exibidos em pt-BR (mono).
- **Filtros de período e de lista** (Pendentes/Conciliadas/Todas, entradas/saídas) são **client-side** sobre o que o backend retorna (a listagem de transações não filtra no servidor).
- **Import é JSON com o arquivo como texto** (não multipart): o front lê o arquivo OFX/CSV e envia o conteúdo; PDF/OCR fica fora (#145).
- **Reaproveita** a infra do app: design system (tokens), i18n (PT-BR), padrões de erro (AppError/QueryError), seleção/máscara monetária e padrões de grid já usados em Contas a Pagar.
- **PR próprio → `develop`**, branch `034-bank-reconciliation`, TDD, gates verdes; sem regressão em Contas a Pagar.
