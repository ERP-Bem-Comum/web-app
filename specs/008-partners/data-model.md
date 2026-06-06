# Data Model: Gestão de Parceiros (`partners`)

**Feature**: `specs/008-partners/` · **Fase 1 do plan** · Complementa `domain.md`

> Detalha agregados/VOs (`server/domain`) e Models (`client/data`). Branded types + smart constructors
> retornam `Result<T,E>` (Princ. IV). Zod valida na borda (Princ. VI).

## Value Objects (branded — `server/domain`)

| VO | Forma | Regra (smart constructor) |
|---|---|---|
| `CPF` | `Brand<string,'CPF'>` | 11 dígitos + dígitos verificadores |
| `CNPJ` | `Brand<string,'CNPJ'>` | 14 dígitos + DV |
| `Email` | `Brand<string,'Email'>` | formato válido |
| `UF` | union literal das 27 siglas | ∈ conjunto fechado |
| `Phone` | `Brand<string,'Phone'>` | dígitos normalizados |
| `PixKey` | `{ keyType: 'cpf'\|'cnpj'\|'email'\|'phone'\|'random'; key: string }` | `key` coerente com `keyType` |
| `RegistrationStatus` | `'pre-registration' \| 'complete'` | transição só `pre → complete` |
| `ActivationStatus` | `'active' \| 'inactive'` | — |
| `DeactivationReason` | union de motivos (enum do core-api) | obrigatório ao desativar Colaborador |
| `OccupationArea` | `'PARC'\|'DDI'\|'DCE'\|'EPV'` | conjunto fechado |
| `EmploymentRelationship` | `'CLT'\|'PJ'` | conjunto fechado |

## Agregados (`server/domain`)

### `Collaborator` (PF)
```
Collaborator {
  id
  // pré-cadastro (7)
  legalRepresentative, email: Email, cpf: CPF, occupationArea: OccupationArea,
  role, startOfContract, employmentRelationship: EmploymentRelationship,
  registration: RegistrationStatus, activation: ActivationStatus,
  // completo (opcionais até Cadastrado)
  rg?, fullAddress?, birthDate?, mobile?, emergencyContactName?, emergencyContactPhone?,
  genderIdentity?, race?, hasAllergy?, allergies?, foodCategory?, education?,
  publicSectorExperience?, miniBio?(max 500),
  deactivation?: { reason: DeactivationReason }
}
```
**Invariantes**: CPF válido/único; `registration` unidirecional; desativação exige `reason`.

### `Supplier` (PJ)
```
Supplier {
  id, name, email: Email, cnpj: CNPJ, corporateName, fantasyName,
  serviceCategory, bankAccount?: { bank, agency, accountNumber, checkDigit },
  pixKey?: PixKey, activation: ActivationStatus
}
```
**Invariantes**: CNPJ válido; PIX coeso; bancário opcional.

### `Financier` (PJ)
```
Financier { id, name, corporateName, legalRepresentative, cnpj: CNPJ, telephone: Phone, address, activation: ActivationStatus }
```

### Referências territoriais (VOs de referência — ADR-0002)
```
PartnerState { uf: UF, name, isPartner: boolean }                          // toggle por uf; toggle retorna o DTO (otimista)
PartnerMunicipality { ibgeCode, uf: UF, name, isPartner: boolean }          // identidade = ibgeCode (7 díg.); toggle por ibgeCode; toggle retorna DTO
```

## Models do client (`client/data` — Zod)

| Model | Campos expostos à UI |
|---|---|
| `CollaboratorListItem` | id, legalRepresentative, email, occupationArea, role, registration, activation |
| `CollaboratorDetail` | todos os campos do agregado (pré + completo) |
| `SupplierListItem` | id, name, serviceCategory, activation |
| `SupplierDetail` | cadastrais + bankAccount + pixKey |
| `FinancierListItem` / `FinancierDetail` | 6 campos |
| `PartnerStateItem` | uf, name, isPartner |
| `PartnerMunicipalityItem` | ibgeCode, uf, name, isPartner |

## Relacionamentos

- `Supplier.bankAccount`/`pixKey` são **lidos** por `contracts` (downstream) — herança de dados bancários.
- Estados/Municípios não referenciam os agregados de parceiro-pessoa; são dimensão territorial separada.

## Paginação & filtros (listas)

- Paginação: `{ page, pageSize ∈ {5,10,25} }`.
- Filtros Colaborador (suportados pelo core-api): `search, active, status, occupationAreas, employmentRelationships, genderIdentities, breeds, educations, disableBy, roles, yearOfContract`.
- Filtros **fora de escopo** (programa, idade): backend descartou (FR-012). Idade derivável de `dateOfBirth` no client; "programa" removido da UI. Ver R-007 / FR-019.
- Filtros Fornecedor: `search, active, categories[]`.
