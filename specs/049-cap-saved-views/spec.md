# Feature Specification: Visões salvas (saved views) — Contas a Pagar

**Feature Branch**: `049-cap-saved-views`

**Created**: 2026-07-08

**Status**: Draft (front-first / localStorage)

**Input**: core-api#351 (camada Frontend/BFF) — o web-app guarda e aplica combinações de filtros salvas
pelo usuário na listagem de Contas a Pagar (preferência de UI).

> **Variante `-fe` (frontend / web-app).** Descreve o **quê** (jornada, requisitos, critérios). O **como**
> (ViewModel puro §XI, persistência em localStorage no binding, view burra) fica no `plan.md`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Salvar a combinação de filtros atual como uma visão (Priority: P1)

Como analista financeiro que repete as mesmas consultas (ex.: "RPA a vencer neste mês", "tudo em Aberto do
fornecedor X"), quero salvar a combinação de filtros atual com um nome, para reaplicá-la depois sem
remontar filtro por filtro.

**Why this priority**: é o núcleo — sem capturar/nomear o snapshot, não há visão a reaplicar.

**Independent Test**: montar filtros na listagem (status + vencimento/emissão/tipo/fornecedor), abrir o menu
"Visões", digitar um nome e Salvar; a visão aparece na lista do menu e sobrevive ao reload da página.

**Acceptance Scenarios**:

1. **Given** um status ativo e 1+ filtros avançados, **When** abro "Visões", digito "RPA de julho" e clico
   Salvar, **Then** a visão passa a constar na lista do menu.
2. **Given** o campo de nome vazio, **When** olho o botão Salvar, **Then** ele está desabilitado.
3. **Given** uma visão salva, **When** recarrego a página, **Then** a visão continua na lista (persistida no
   navegador).

---

### User Story 2 - Aplicar uma visão salva (Priority: P1)

Como analista, quero clicar numa visão salva e ver a listagem reassumir exatamente aquele status + aquelas
dimensões de filtro + aqueles valores, num único passo.

**Why this priority**: é a contraparte do salvar; junto com US1 entrega o valor completo.

**Independent Test**: com filtros diferentes na tela, abrir "Visões", clicar numa visão salva e ver os chips
de status, as dimensões ativas e os valores dos filtros reassumirem o snapshot salvo, com a página voltando
à 1.

**Acceptance Scenarios**:

1. **Given** a tela com filtros diferentes, **When** clico numa visão salva, **Then** status + dimensões +
   valores dos filtros são substituídos pelos da visão (num único update), e a paginação volta à página 1.
2. **Given** uma visão sem filtro de fornecedor, **When** a aplico enquanto o combo de fornecedor estava
   preenchido, **Then** a busca/autocomplete do fornecedor é limpa (o rótulo do combo não faz parte da visão).

---

### User Story 3 - Excluir uma visão salva (Priority: P2)

Como analista, quero excluir uma visão que não uso mais, para manter a lista enxuta.

**Why this priority**: higiene da lista; não bloqueia salvar/aplicar.

**Independent Test**: abrir "Visões", clicar no × de uma visão e vê-la sumir da lista (e do armazenamento).

**Acceptance Scenarios**:

1. **Given** 2+ visões salvas, **When** clico no × de uma, **Then** ela some da lista e não retorna ao reload.

---

### Edge Cases

- **Armazenamento corrompido/indisponível**: se o dado persistido estiver corrompido (JSON inválido, shape
  inesperado) ou o `localStorage` estiver indisponível (SSR / modo privado), a tela abre com **zero visões**,
  sem erro (a preferência é descartável — nunca derruba a listagem).
- **Entradas parcialmente inválidas**: uma visão persistida com um campo malformado (status desconhecido,
  dimensão inexistente) é descartada silenciosamente; as demais sobrevivem.
- **Nome só com espaços**: tratado como vazio (não vira visão).

## Requirements _(mandatory)_

- **FR-001**: O sistema DEVE permitir salvar a combinação atual de `{ status, dimensões ativas, valores de
filtro }` como uma visão nomeada.
- **FR-002**: O sistema DEVE listar as visões salvas e aplicar a escolhida, substituindo o estado de filtros
  da tela num único passo (status + dimensões + valores + volta à página 1).
- **FR-003**: O sistema DEVE permitir excluir uma visão salva.
- **FR-004**: As visões DEVEM persistir entre sessões/reloads **por navegador** (preferência de UI).
- **FR-005**: A leitura do armazenamento DEVE ser **tolerante**: dado ausente/corrompido/inválido → nenhuma
  visão, sem lançar exceção.
- **FR-006**: O escopo salvo cobre **apenas** os filtros que existem hoje no front (status +
  vencimento/emissão/tipo/fornecedor). Predicados futuros (#164: valor, contrato, programa, nº doc, CNPJ/CPF)
  serão incorporados naturalmente quando entrarem no shape de filtros.

### Non-Goals

- Persistência **server-side por usuário** no BFF (upgrade futuro; o issue diz "web-app guarda" e o
  localStorage satisfaz o front-first).
- Compartilhar visões entre usuários; visão default/fixada; ordenação/renomear.

## Success Criteria _(mandatory)_

- **SC-001**: Salvar → recarregar → a visão continua listada e, ao aplicá-la, a listagem reassume o snapshot.
- **SC-002**: Armazenamento corrompido não gera erro em tela (abre com zero visões).
- **SC-003**: Gates verdes (`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`),
  baseline de lint mantida.
