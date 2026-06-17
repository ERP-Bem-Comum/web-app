# Feature Specification: Dados bancários + PIX no Colaborador (create-only)

**Feature Branch**: `integration/collaborator-bank-pix-032`

**Created**: 2026-06-17

**Status**: Draft

**Input**: O core-api passou a aceitar `bankAccount` + `pixKey` no Colaborador (#40, US1 da feature 015), shape idêntico ao Fornecedor — mas **create-only** (o PUT omite, igual ao território). Hoje o form do Colaborador tem a seção bancária **gated** (desabilitada). Esta feature un-gata: captura banco/PIX no **cadastro** e exibe (read-only) no **detalhe**.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Informar banco/PIX do Colaborador no cadastro (Priority: P1)

Um operador cadastra um Colaborador e informa (opcionalmente) dados bancários (banco, agência, conta, dígito) e/ou chave PIX (tipo + chave). Ao salvar, vão ao backend; no detalhe aparecem (somente leitura — o PUT não altera banco/PIX).

**Why this priority**: É a entrega — o backend já aceita; a seção existe gated. Espelha o Fornecedor (item C).

**Independent Test**: Cadastrar colaborador com banco + PIX, abrir o detalhe e ver; cadastrar sem banco/PIX e confirmar que segue válido.

**Acceptance Scenarios**:

1. **Given** o form de Colaborador, **When** preenche banco e salva, **Then** o backend recebe `bankAccount` e o detalhe exibe.
2. **Given** o form, **When** escolhe tipo de chave PIX e informa a chave, **Then** o backend recebe `pixKey` e o detalhe exibe.
3. **Given** o form sem banco/PIX, **When** salva, **Then** válido (`null`).
4. **Given** o detalhe (edição), **When** aberto, **Then** banco/PIX são **somente leitura** (PUT omite) e não são enviados na edição.

### Edge Cases

- **Banco parcial**: coesão igual ao Fornecedor (objeto coeso ou null); banco parcial bloqueia o submit.
- **PUT omite banco/PIX** (igual ao território, #42): a edição NÃO envia banco/PIX; no detalhe ficam read-only.
- **Retrocompat**: colaboradores sem banco/PIX seguem válidos.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O contrato do Colaborador (client + BFF) MUST incluir `bankAccount`/`pixKey` (nullable) no **create input** e no **detail**; o **update OMITE** ambos.
- **FR-002**: O form de cadastro MUST un-gatar a seção "Dados bancários e PIX" (campos ligados ao controller), espelhando o Fornecedor.
- **FR-003**: Ambos opcionais; ausência → `null`; documento válido.
- **FR-004**: Ao salvar o create, o BFF MUST enviar banco/PIX; o update NÃO os envia.
- **FR-005**: O detalhe MUST exibir banco/PIX (read-only) quando presentes; degradar quando ausentes.
- **FR-006**: Reuso (DRY) dos tipos/validações de banco/PIX do Fornecedor; sem duplicação divergente.
- **FR-007**: Mudança aditiva, sem regressão; gates verdes; i18n já existente (a seção era gated).

### Key Entities

- **BankAccount/PixKey** (Colaborador): mesmo shape do Fornecedor; **create-only**.

## Success Criteria _(mandatory)_

- **SC-001**: Cadastrar colaborador com banco + PIX → backend recebe → detalhe exibe.
- **SC-002**: Cadastrar sem banco/PIX → válido (`null`).
- **SC-003**: Edição NÃO envia banco/PIX (PUT omite); detalhe read-only.
- **SC-004**: Zero regressão; suítes verdes.
- **SC-005**: Sem duplicação de lógica de validação banco/PIX (reuso).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Somente frontend — backend já aceita (#40). Sem alteração no backend.

- **BC**: Parceiros (Colaborador — create + detail).
- **Borda**: `collaborator.io.ts` (Create/Detail +bank/PIX; Update via `Omit`), `collaborator.schema.ts` (DTOs no detail), `collaborator.io-schemas.ts` (guards; update omite), adapter, client model, form (un-gate) + detalhe (read-only).
- **Reuso**: tipos/validações do Fornecedor (BankAccount/PixKey/PIX_KEY_TYPES/form-schemas).

## Assumptions

- Contrato (consultant): banco/PIX no create do colaborador, shape do Fornecedor; **PUT omite** (igual território). i18n da seção já existe (gated).
- Escopo = banco/PIX do Colaborador apenas. Demais sub-features do #015: D1 (perfil), D4 (histórico), D5 (autocadastro) — separadas.
- Off `develop`; PR próprio → develop. Toca os mesmos arquivos do D2 (form/model/io do colaborador) → reconciliar na ordem de merge.
