# Feature Specification: Dados bancários + PIX no Financiador

**Feature Branch**: `integration/financier-bank-pix-030`

**Created**: 2026-06-17

**Status**: Implemented (gates verdes: typecheck+lint 0 + 526 node:test + 138 DOM). Validação em tela pendente (rebuild dedicado — esta branch off develop não tem o Financeiro).

**Input**: O core-api passou a aceitar `bankAccount` e `pixKey` no **Financiador** (#40, US1 da feature 015 — VO payment-target compartilhado), com shape **idêntico ao Fornecedor** (que o front já implementa). Hoje o Financiador é PJ-only sem dados bancários/PIX. Esta feature adiciona esses dados ao cadastro/edição e ao detalhe do Financiador, espelhando o Fornecedor.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cadastrar/editar Financiador com dados bancários + PIX (Priority: P1)

Um operador cadastra ou edita um Financiador e informa (opcionalmente) os dados bancários (banco, agência, conta, dígito) e/ou uma chave PIX (tipo + chave). Ao salvar, esses dados são enviados ao backend; ao reabrir o detalhe, aparecem preenchidos.

**Why this priority**: É a entrega — o backend já aceita; sem o front, não há como informar banco/PIX de Financiador. Espelha o Fornecedor (padrão consolidado).

**Independent Test**: Cadastrar um Financiador com banco + PIX, reabrir o detalhe e ver os dados; cadastrar sem banco/PIX e confirmar que segue válido (campos opcionais).

**Acceptance Scenarios**:

1. **Given** o form de Financiador, **When** o operador preenche banco/agência/conta/dígito e salva, **Then** o backend recebe `bankAccount` e o detalhe exibe os dados.
2. **Given** o form, **When** o operador escolhe um tipo de chave PIX e informa a chave, **Then** o backend recebe `pixKey` (keyType + key) e o detalhe exibe.
3. **Given** o form sem banco e sem PIX, **When** salva, **Then** segue válido (ambos opcionais → `null`).
4. **Given** a edição de um Financiador com banco/PIX, **When** abre o form, **Then** os campos vêm preenchidos e podem ser alterados/limpos.
5. **Given** o detalhe de um Financiador sem banco/PIX, **When** exibido, **Then** as seções degradam (placeholder/ocultas) sem quebrar.

### Edge Cases

- **Banco parcial**: a coesão dos campos bancários segue a mesma regra do Fornecedor (objeto coeso ou null) — reusar a validação existente.
- **Tipo de chave PIX** = `cpf | cnpj | email | phone | random-key` (enum do contrato). A validação fina da chave por tipo segue o padrão do Fornecedor (o backend é o árbitro final).
- **Retrocompat**: Financiadores existentes sem banco/PIX continuam válidos e exibíveis.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O modelo/contrato de Financiador (client + BFF) MUST incluir `bankAccount` e `pixKey` (ambos nullable), com shape idêntico ao Fornecedor.
- **FR-002**: O form de cadastro/edição de Financiador MUST oferecer a seção "Dados bancários e PIX" (banco, agência, conta, dígito; tipo de chave + chave PIX), espelhando o Fornecedor.
- **FR-003**: Ambos MUST ser opcionais; ausência → `null`; o documento permanece válido.
- **FR-004**: Ao salvar, o BFF MUST enviar `bankAccount`/`pixKey` ao core-api no shape esperado (reusando a validação/borda do Fornecedor).
- **FR-005**: O detalhe do Financiador MUST exibir banco/PIX quando presentes; degradar quando ausentes.
- **FR-006**: A validação de coesão bancária e dos tipos de chave PIX MUST reusar as regras já existentes do Fornecedor (DRY), sem duplicar lógica divergente.
- **FR-007**: Mudança aditiva, sem regressão nos 6 campos atuais do Financiador, com gates verdes; i18n para os rótulos novos (reusar chaves do padrão de parceiros quando existirem).

### Key Entities

- **BankAccount** (Financiador): `{ bank, agency, accountNumber, checkDigit }` (strings) ou null — igual ao Fornecedor.
- **PixKey** (Financiador): `{ keyType: 'cpf'|'cnpj'|'email'|'phone'|'random-key', key }` ou null — igual ao Fornecedor.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Cadastrar Financiador com banco + PIX → backend recebe os dados → detalhe exibe.
- **SC-002**: Cadastrar Financiador sem banco/PIX → válido, `null` enviado.
- **SC-003**: Editar Financiador hidrata banco/PIX existentes e permite alterar/limpar.
- **SC-004**: Zero regressão nos campos atuais do Financiador (suítes verdes).
- **SC-005**: Nenhuma duplicação de lógica de validação bancária/PIX (reuso do padrão do Fornecedor).

## Impacto Arquitetural (frontend / BFF) _(obrigatório)_

> Feature **somente frontend** — o core-api já aceita banco/PIX no Financiador (#40). Sem alteração no backend.

- **Bounded Contexts afetados**: [x] Parceiros (Financiador — create/edit/detail).
- **Borda**: `financier.schema.ts` (detail response + write body com `bankAccount`/`pixKey`), `core-api-financiers.ts` (mapper detail + `toWriteBody`), `financier.io.ts` + client `financier.model.ts` (tipos + form schema), `financier-form.component.tsx`/`.controller.ts` (seção UI), detalhe do Financiador.
- **Reuso**: tipos/validação/máscaras já existentes do Fornecedor (BankAccount, PixKey, PIX_KEY_TYPES, máscara de agência) — DRY.
- **Invariantes**: Zod na borda; views burras; tokens-only; i18n; sem `class`/`throw` fora da borda.

## Assumptions

- Contrato confirmado (core-api-consultant): Financiador detalhe e create/update aceitam `bankAccount: {bank,agency,accountNumber,checkDigit}|null` e `pixKey: {keyType,key}|null`; `keyType` response = `cpf|cnpj|email|phone|random-key`; PUT = create (aceita ambos). Shape idêntico ao Fornecedor.
- Escopo desta feature = **Financiador apenas**. Banco/PIX do **Colaborador** (#40 também) entra no item **D (Colaborador completo #015)** — e lá é **create-only** (PUT omite), atenção distinta.
- Feature off `develop` (financier existe lá), independente do #35; PR próprio → develop (1 feature por PR).
- Reusar os tipos do Fornecedor pode exigir promovê-los a um ponto compartilhado de parceiros, OU espelhá-los em `financier.*`. Decisão no `/speckit-plan` (preferir reuso sem furar boundaries).
