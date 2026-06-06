# Contracts — Server Functions do BFF (`partners`)

**Feature**: `specs/008-partners/contracts/` · Fase 1 do plan.

> A **server function** é a única fronteira client↔server (Princ. I). Cada contrato define **input** (Zod,
> validado na entrada) e **output** (Model normalizado / `Response` com status preservado). Erros viram
> `AppError.kind` no client (a UI nunca vê status HTTP). Onde a prontidão é 🔴/parcial, o contrato é o
> mesmo — muda só a implementação do gateway (real|mock), ADR-0001.

## Convenções

- Input sempre validado por Zod no início da server fn; falha → `AppError('validation')`.
- Output de listas: `{ items: Model[], page, pageSize, total }`.
- Mutations retornam o Model atualizado ou `{ id }`.
- Erros mapeados: `not-found` (404), `validation` (400/422), `unauthorized` (401→signOut), `conflict` (409), `unknown` (5xx).

## Colaboradores

| Server fn | Input (Zod) | Output | core-api |
|---|---|---|---|
| `listCollaborators` | `{ search?, active?, status?, occupationAreas?[], employmentRelationships?[], genderIdentities?[], breeds?[], educations?[], disableBy?, roles?[], yearOfContract?, page, pageSize }` | `{ items: CollaboratorListItem[], page, pageSize, total }` | `GET /api/v1/collaborators` |
| `getCollaborator` | `{ id }` | `CollaboratorDetail` | `GET /api/v1/collaborators/:id` |
| `createCollaborator` | `{ legalRepresentative, email, cpf, occupationArea, role, startOfContract, employmentRelationship }` | `{ id }` (status `Pré Cadastrado`) | `POST /api/v1/collaborators` |
| `completeCollaboratorRegistration` | `{ id, ...dadosCompletos }` | `CollaboratorDetail` (status `Cadastrado`) | `PATCH /api/v1/collaborators/:id/complete-registration` |
| `updateCollaborator` | `{ id, ...campos }` | `CollaboratorDetail` | `PUT /api/v1/collaborators/:id` |
| `deactivateCollaborator` | `{ id, reason }` (reason obrigatório) | `{ id }` | `POST /api/v1/collaborators/:id/deactivate` |
| `importCollaborators` | **string CSV** (Zod, ≤2 MiB; colunas `name,email,cpf,occupationArea,role,startOfContract,employmentRelationship`) | `{ created, failed: { line, error }[] }` (sempre 200; malformado→400) | `POST /api/v1/collaborators/import` — client lê `File.text()`→string; server fn repassa `text/csv` (parsing+anti-injection no `server/domain`) |

## Fornecedores

| Server fn | Input | Output | core-api |
|---|---|---|---|
| `listSuppliers` | `{ search?, active?, categories?[], page, pageSize }` | `{ items: SupplierListItem[], ... }` | `GET /api/v1/suppliers` |
| `getSupplier` | `{ id }` | `SupplierDetail` | `GET /api/v1/suppliers/:id` |
| `createSupplier` | `{ name, email, cnpj, corporateName, fantasyName, serviceCategory, bankAccount?, pixKey? }` | `{ id }` | `POST /api/v1/suppliers` |
| `updateSupplier` | `{ id, ...campos }` | `SupplierDetail` | `PUT /api/v1/suppliers/:id` |
| `deactivateSupplier` | `{ id }` | `{ id }` | `POST /api/v1/suppliers/:id/deactivate` |
| `exportSuppliers` | `{ search?, active?(0\|1), categories?[] }` | CSV (`text/csv`, attachment, nosniff) | `GET /api/v1/suppliers/export` |
| `listServiceCategories` | `{}` | `string[]` (**39** códigos canônicos) | `GET /api/v1/suppliers/service-categories` |

## Financiadores

| Server fn | Input | Output | core-api |
|---|---|---|---|
| `listFinanciers` | `{ search?, page, pageSize }` | `{ items: FinancierListItem[], ... }` | `GET /api/v1/financiers` |
| `getFinancier` | `{ id }` | `FinancierDetail` | `GET /api/v1/financiers/:id` |
| `createFinancier` | `{ name, corporateName, legalRepresentative, cnpj, telephone, address }` | `{ id }` | `POST /api/v1/financiers` |
| `updateFinancier` | `{ id, ...campos }` | `FinancierDetail` | `PUT /api/v1/financiers/:id` |
| `deactivateFinancier` | `{ id }` | `{ id }` | `POST /api/v1/financiers/:id/deactivate` |

## Estados / Municípios parceiros (🟢 real — ADR-0002)

> Toggles **idempotentes** (`POST` ativa / `DELETE` desativa). Permissões `geography:read/write`.
> Município é identificado por **`ibgeCode`** (não por nome) e a listagem exige `uf`.
> **Rev. 2**: cada toggle **retorna o DTO atualizado** (`{ uf, isPartner }` / `{ ibgeCode, uf, name, isPartner }`,
> `200`) → o view-model aplica **atualização otimista** com o DTO, sem refetch obrigatório.

| Server fn | Input | Output | core-api |
|---|---|---|---|
| `listPartnerStates` | `{}` | `PartnerStateItem[]` (27 UFs + `isPartner`) | `GET /api/v1/partner-states` |
| `togglePartnerState` | `{ uf, isPartner }` | `PartnerStateItem` | `POST/DELETE /api/v1/partner-states/:uf` (UF inválida→400) |
| `listMunicipalitiesByUf` | `{ uf }` (obrigatório) | `PartnerMunicipalityItem[]` (`{ ibgeCode, uf, name, isPartner }`) | `GET /api/v1/partner-municipalities?uf=XX` |
| `togglePartnerMunicipality` | `{ ibgeCode, isPartner }` | `PartnerMunicipalityItem` | `POST/DELETE /api/v1/partner-municipalities/:ibgeCode` (código inválido→400) |

> Schemas Zod concretos (`*.schema.ts`) ficam em `src/modules/partners/server/adapters/` na implementação.
> Este README é o contrato de referência; a fonte executável é o código + os schemas.
