# Feature Specification: Grid de Contas a Pagar resolve fornecedor pelo read-model do backend

**Feature Branch**: `integration/financial-supplier-readmodel-029`

**Created**: 2026-06-17

**Status**: Implemented (gates verdes); validação em tela BLOQUEADA — o core-api local retorna supplierName/supplierDocument null (read-model fin_supplier_view não populado, #47 backfill não rodou). Merge de B regrediria o grid até o backend popular. Decisão pendente: hold vs hybrid (DTO-first + fallback partners-map).

**Input**: O core-api passou a resolver o fornecedor (nome + CNPJ) no item da lista de `GET /api/v2/financial/documents` via read-model local (#47 US2 — `supplierName`, `supplierDocument`). Hoje o front faz um **workaround**: busca os parceiros à parte (`partners-map.binding.ts`) e resolve `nome`/`tipo`/`CNPJ` por `supplierRef` no client. Esta feature substitui o workaround pelo dado já resolvido no DTO e remove o código morto.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ver fornecedor (nome + CNPJ) no grid sem busca extra (Priority: P1)

Um operador abre Contas a Pagar e vê, em cada linha, o nome do fornecedor e o CNPJ — vindos direto do item da lista (resolvidos no backend), sem o front precisar cruzar com a lista de parceiros.

**Why this priority**: É o objetivo da feature — remover dívida técnica (workaround `partners-map`) e usar a fonte confiável (read-model do backend), reduzindo chamadas e o acoplamento client-side Financeiro↔Parceiros.

**Independent Test**: Abrir o grid e confirmar que nome + CNPJ aparecem corretos para documentos com fornecedor; e que a tela não dispara mais a busca de parceiros só para resolver o fornecedor.

**Acceptance Scenarios**:

1. **Given** um documento cujo fornecedor foi projetado no read-model, **When** o grid carrega, **Then** a coluna Fornecedor mostra o `supplierName` e o CNPJ (`supplierDocument`) do item da lista.
2. **Given** um documento com `supplierRef` nulo **ou** ainda não projetado (consistência eventual), **When** exibido, **Then** a célula degrada graciosamente (ex.: "—") sem quebrar a linha.
3. **Given** a tela de Contas a Pagar, **When** carrega, **Then** **não** há mais a busca paralela de parceiros (`partners-map`) só para resolver fornecedor.
4. **Given** um CNPJ alfanumérico no `supplierDocument`, **When** exibido, **Then** é mascarado corretamente (consistente com a feature de CNPJ alfanumérico).

### Edge Cases

- **`supplierName`/`supplierDocument` nulos** (ref nulo ou projeção pendente): exibir fallback ("—"); nunca quebrar.
- **Só Fornecedor é resolvido pelo read-model** (#90 aberta): documentos com favorecido de outro tipo continuam sem nome/CNPJ resolvidos → fallback "—" (sem regressão vs. hoje, e coerente com o backend).
- **Busca/ordenação**: o filtro de busca por fornecedor/CNPJ do grid deve seguir funcionando (usa o texto exibido / DTO).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O DTO da lista de Contas a Pagar consumido pelo front MUST incluir `supplierName` e `supplierDocument` (CNPJ) do item, validados na borda (Zod), ambos nullable.
- **FR-002**: O grid MUST exibir nome + CNPJ do fornecedor a partir do item da lista (não mais via resolução client-side por `supplierRef`).
- **FR-003**: O front MUST parar de usar o workaround de resolução de fornecedor (`partners-map`) **na LISTA** (`contas-a-pagar.binding` + os params `resolve*` de `toRow`). ⚠️ O **drawer de detalhe** (`document-detail.binding`) **mantém** o `partners-map` enquanto o `GET /documents/:id` não for enriquecido (#95 aberta) — portanto o arquivo `partners-map.binding.ts` e os tipos `Resolve*` **permanecem** (1 consumidor restante). A remoção total fica para quando #95 entregar.
- **FR-004**: Valores nulos (`supplierName`/`supplierDocument` ausentes) MUST degradar para um placeholder ("—") sem quebrar a renderização.
- **FR-005**: O CNPJ exibido MUST ser mascarado pelo helper de CNPJ (compatível com alfanumérico).
- **FR-006**: A mudança MUST ser aditiva no contrato e sem regressão visual/comportamental no grid (mesmas colunas/ações), com gates verdes.
- **FR-007**: Se a coluna usava o **tipo** do parceiro (avatar/badge por kind) resolvido via workaround, e o DTO não fornece o kind, o comportamento MUST degradar de forma definida (ex.: avatar/badge neutro) sem quebra — documentado nas Assumptions.

### Key Entities

- **supplierName**: `string | null` no item da lista — nome do fornecedor resolvido no backend (read-model `fin_supplier_view`).
- **supplierDocument**: `string | null` no item da lista — CNPJ do fornecedor (texto, pode ser alfanumérico, ADR-0044).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O grid exibe nome + CNPJ corretos para documentos com fornecedor projetado, lendo do item da lista.
- **SC-002**: O **carregamento da LISTA** de Contas a Pagar não dispara mais a query `partners-map` (a lista lê fornecedor do DTO). A query só ocorre ao abrir o **drawer de detalhe** (lazy, até #95).
- **SC-003**: Documentos sem fornecedor resolvido exibem "—" sem erro.
- **SC-004**: Zero regressão nas demais colunas/ações do grid e nas suítes (gates verdes).
- **SC-005**: A LISTA não importa mais `partners-map`/`resolve*` (verificável por busca em `contas-a-pagar.binding.ts` e no `toRow`); o drawer de detalhe segue usando (esperado, #95).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Feature **somente frontend** — o core-api já resolve fornecedor no DTO (#47 US2). Sem alteração no backend.

- **Bounded Contexts afetados**: [x] Financeiro (Contas a Pagar — lista). Reduz acoplamento com Parceiros (remove cruzamento client-side).
- **Borda**: `financial.schema.ts` (+`supplierName`/`supplierDocument`), `financial.mappers.ts`, `document.io.ts`, model do client e `contas-a-pagar.view-model.ts`; remover `partners-map.binding.ts` e os `Resolve*` correlatos do binding da página.
- **Invariantes**: validação Zod na borda; views burras; máscara de CNPJ via helper; i18n; sem fetch extra.

## Assumptions

- Contrato confirmado (core-api-consultant): `documentSummarySchema` agora tem `supplierName: string|null` e `supplierDocument: string|null` (=CNPJ); nulos quando `supplierRef` é nulo ou a projeção (`fin_supplier_view`, alimentada por worker via `par_outbox`) ainda não rodou → manter fallback. Só resolve **Fornecedor** (coerente com #90 aberta).
- O grid hoje também resolve **tipo do parceiro** (avatar/badge por kind) via workaround. Como o DTO não traz o kind, assume-se degradar para um estilo neutro de fornecedor (a confirmar no plano: manter avatar de "fornecedor" como default, já que o read-model só projeta Fornecedor) — sem nova chamada.
- Feature sobre `contas-a-pagar-026` (onde o Financeiro vive); PR aponta para `develop` após o #35 mergear (1 feature por PR).
- A feature de **CNPJ alfanumérico** (027) é independente; ambas tocam `contas-a-pagar.view-model.ts` e serão conciliadas no merge (ordem de PR).
