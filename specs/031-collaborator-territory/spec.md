# Feature Specification: Território (UF + município) no Colaborador

**Feature Branch**: `integration/collaborator-territory-031`

**Created**: 2026-06-17

**Status**: Implemented (gates verdes: typecheck+lint 0 + 526 node:test + 138 DOM). Validação em tela pendente (rebuild dedicado — branch off develop).

**Input**: O core-api passou a aceitar `territory` (UF + município) no Colaborador (#42, US3 da feature 015). Hoje o Colaborador no front não tem território. Esta feature adiciona UF (sigla IBGE) + município (texto livre) ao **cadastro** e ao **detalhe** do Colaborador. Entra no **create** (o PUT omite território — assimetria do contrato).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Informar o território do Colaborador no cadastro (Priority: P1)

Um operador cadastra um Colaborador e informa (opcionalmente) a UF (escolhida de uma lista das 27 UFs) e o município (texto livre). Ao salvar, o território vai ao backend; ao abrir o detalhe, aparece preenchido.

**Why this priority**: É a entrega — o backend já aceita; sem o front, não há como registrar o território do colaborador.

**Independent Test**: Cadastrar um colaborador com UF + município, abrir o detalhe e ver os dados; cadastrar sem território e confirmar que segue válido (opcional).

**Acceptance Scenarios**:

1. **Given** o form de Colaborador, **When** o operador seleciona uma UF e digita o município e salva, **Then** o backend recebe `territory: { uf, municipality }` e o detalhe exibe.
2. **Given** o form sem território, **When** salva, **Then** segue válido (`territory` ausente/null).
3. **Given** o detalhe de um colaborador com território, **When** exibido, **Then** mostra UF (por extenso ou sigla) e município.
4. **Given** o detalhe de um colaborador sem território, **When** exibido, **Then** degrada (placeholder/oculto) sem quebrar.
5. **Given** uma UF inválida rejeitada pelo backend, **When** salva, **Then** o erro é exibido (o core-api é o árbitro do catálogo IBGE).

### Edge Cases

- **UF sem município / município sem UF**: decidir no plano se a UI exige ambos juntos ou aceita parcial — o backend aceita `{ uf: null, municipality: null }` e provavelmente parciais; o front degrada para `null` no campo vazio.
- **Município é texto livre** (não há catálogo no contrato do colaborador) — **não** usar a lista de municípios da geografia; é um Input de texto.
- **PUT omite território** (contrato): edição do colaborador NÃO altera território nesta entrega — documentar; o campo de território no detalhe fica somente-leitura (ou editável só no create).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O contrato de Colaborador (client + BFF) MUST incluir `territory: { uf: string | null; municipality: string | null } | null` no **create input** e no **detail**.
- **FR-002**: O form de cadastro MUST oferecer um seletor de **UF** (27 UFs) e um campo de **município (texto livre)**, ambos opcionais.
- **FR-003**: Ao salvar o create, o BFF MUST enviar `territory` no shape esperado (campos vazios → `null`).
- **FR-004**: O detalhe do Colaborador MUST exibir UF + município quando presentes; degradar quando ausentes.
- **FR-005**: O município MUST ser entrada de texto livre (sem consumir o catálogo de municípios da geografia).
- **FR-006**: A validação fina da UF (catálogo IBGE) permanece no backend; o front só oferece as 27 siglas e exibe o erro do backend quando inválido.
- **FR-007**: Como o **PUT omite território**, a edição NÃO deve tentar enviar `territory` (evita divergência); território é definido no create. Mudança aditiva, sem regressão, gates verdes; i18n para os rótulos.

### Key Entities

- **Territory** (Colaborador): `{ uf: string | null, municipality: string | null }` ou `null`. `uf` = sigla IBGE (ex.: "SP"); `municipality` = texto livre.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Cadastrar colaborador com UF + município → backend recebe `territory` → detalhe exibe.
- **SC-002**: Cadastrar sem território → válido, `null` enviado.
- **SC-003**: Detalhe sem território → degrada sem erro.
- **SC-004**: Zero regressão nos campos atuais do colaborador (suítes verdes).
- **SC-005**: A UI de município NÃO dispara a query de municípios da geografia (é texto livre).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Feature **somente frontend** — o core-api já aceita `territory` no Colaborador (#42). Sem alteração no backend.

- **Bounded Contexts afetados**: [x] Parceiros (Colaborador — create + detail).
- **Borda**: `collaborator.schema.ts` (territory no detail + create body), `core-api-collaborators.ts` (detailToModel + create body), `collaborator.io.ts` + client `collaborator.model.ts` (tipos + form schema), `collaborator-form.controller.ts`/`.component.tsx` (UF select + município), detalhe do colaborador.
- **Fonte de UF**: as 27 siglas — decisão no plano (reusar `UF_NAMES`/`partnerStatesQueryOptions` da geografia vs lista estática local, respeitando boundaries §I).
- **Invariantes**: Zod na borda; views burras; tokens-only; i18n; sem `class`/`throw` fora da borda.

## Assumptions

- Contrato (core-api-consultant): `territory: { uf: string|null, municipality: string|null }` nullable; entra no **create** (PUT omite, complete-registration não inclui); `uf` validada contra catálogo IBGE no domínio (`territory-uf-invalid` 422); `municipality` é texto livre.
- Escopo = **território no Colaborador apenas** (create + detail). Demais sub-features do #015 (perfil, banco/PIX, histórico, autocadastro) são itens D1/D3/D4/D5 separados.
- Feature off `develop` (colaborador existe lá), independente do #35; PR próprio → develop (1 feature por PR).
- A assimetria "create aceita / PUT omite" território é do backend — a UI reflete (território definido no cadastro; no detalhe, exibido; edição não envia território).
