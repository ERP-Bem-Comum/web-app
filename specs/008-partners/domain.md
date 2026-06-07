# Modelo de Domínio: Gestão de Parceiros (`partners`)

**Feature**: `specs/008-partners/` · **Consultor**: `/acdg-skills:ddd-architect`

> O domínio vive no **`server/`** (BFF, DDD): agregados, value-objects branded, errors-como-valor. O
> **`client/`** consome um **Model** (Zod) já normalizado. Cada decisão de fronteira/agregado está
> ancorada em **citação canônica ≥4 linhas** (Evans/Vernon).

## Bounded Context (módulo vertical)

- **Módulo**: `src/modules/partners/` — fronteira de import enforçada por lint; cross-módulo só via `public-api` (Princ. III).
- **Nome na linguagem ubíqua**: "Gestão de Parceiros" / `partners`. Relações: consome `auth` (sessão) via
  `public-api`; `contracts` herda dados bancários/PIX de Fornecedor (downstream, leitura).

**Justificativa da fronteira** (citação):
> There are only two important points here:
> 1. The BOUNDED CONTEXTS should have names so that you can talk about them. Those names should enter the UBIQUITOUS LANGUAGE of the team.
> 2. Everyone has to know where the boundaries lie, and be able to recognize the CONTEXT of any piece of code or any situation.
> — *(Linha 4877, p. 217, Eric Evans, *Domain-Driven Design*)*

`partners` é um contexto nomeado e isolado: a UI, o agregado e o contrato falam a mesma linguagem
(Colaborador/Fornecedor/Financiador), e a borda com o `core-api` é explícita (server function).

## Linguagem ubíqua

| Termo (PT) | Significado (negócio) | Tipo no código (EN) |
|---|---|---|
| Parceiro | Entidade vinculada à organização (guarda-chuva) | conceito / união |
| Colaborador | PF vinculada a programas; cadastro em 2 etapas | Aggregate `Collaborator` |
| Fornecedor | PJ prestadora; dados bancários + PIX | Aggregate `Supplier` |
| Financiador | PJ que financia programas | Aggregate `Financier` |
| Situação cadastral | `Pré Cadastrado` → `Cadastrado` (Colaborador) | VO/union `RegistrationStatus` |
| Status | Ativo/Inativo (habilitação) | VO/union `ActivationStatus` |
| Estado parceiro | UF marcada como abrangência | VO de referência `PartnerState` |
| Município parceiro | Município marcado como abrangência | VO de referência `PartnerMunicipality` |
| Motivo de desativação | Razão obrigatória (Colaborador) | VO/union `DeactivationReason` |

## Agregados e Value Objects (server/domain)

### Decisão: Collaborator, Supplier e Financier são agregados **separados**

Cada tipo tem invariantes próprias e ciclos de vida independentes — não há invariante transacional que os
una, então não devem ser agrupados num único agregado "Partner".

**Justificativa do boundary do agregado** (citação):
> When trying to discover the Aggregates in a Bounded Context, we must understand the model's true invariants. Only with that knowledge can we determine which objects should be clustered into a given Aggregate.
> An invariant is a business rule that must always be consistent. There are different kinds of consistency. One is transactional consistency, which is considered immediate and atomic. There is also eventual consistency. When discussing invariants, we are referring to transactional consistency.
> — *(Linha 8985, p. 450, Vaughn Vernon, *Implementing Domain-Driven Design*)*

#### Aggregate `Collaborator` (PF)
- **Raiz**: `Collaborator`. **Invariantes**: CPF válido e único; `RegistrationStatus` só avança `Pré → Cadastrado`;
  desativação exige `DeactivationReason`; status duplo (situação × ativação) são eixos independentes.
- **VOs**: `CPF`, `Email`, `OccupationArea` (PARC|DDI|DCE|EPV), `EmploymentRelationship` (CLT|PJ), `RegistrationStatus`, `DeactivationReason`.

#### Aggregate `Supplier` (PJ)
- **Raiz**: `Supplier`. **Invariantes**: CNPJ válido; se há PIX, `PixKey` consistente com `keyType`; bancário opcional mas coeso.
- **VOs**: `CNPJ`, `Email`, `ServiceCategory`, `BankAccount` (banco/agência/conta/dígito), `PixKey` (keyType+key).

#### Aggregate `Financier` (PJ)
- **Raiz**: `Financier`. **Invariantes**: CNPJ válido; razão social e representante legal presentes.
- **VOs**: `CNPJ`, `Phone`, `Address`.

### Decisão: Estado e Município são **Value Objects de referência**, não agregados

`PartnerState`/`PartnerMunicipality` não têm identidade própria nem ciclo de vida — são marcações
imutáveis (UF/nome) com comportamento side-effect-free. A "parceria" é a associação; trocar = substituir.

**Justificativa (Value Object / Side-Effect-Free)** (citação):
> A method of an object can be designed as a Side-Effect-Free Function [Evans]. A function is an operation of an object that produces output but without modifying its own state... The methods of an immutable Value Object must all be Side-Effect-Free Functions because they must not violate its immutability quality.
> — *(Linha 5287, p. 292, Vaughn Vernon, *Implementing Domain-Driven Design*)*

> Reforça o Princ. IV (make illegal states unrepresentable): `UF`, `CPF`, `CNPJ`, `PixKey` são branded
> types com smart constructor retornando `Result<T, E>` — estado inválido não compila/não é construível.

## Model do client (`client/data`)

| Model | Campos (o que a UI consome) | Origem (server fn) |
|---|---|---|
| `CollaboratorListItem` | rep. legal, email, área, função, status, situação | `listCollaborators` |
| `CollaboratorDetail` | 21 campos (pré + completo) | `getCollaborator` |
| `SupplierDetail` | cadastrais + bancários + PIX | `getSupplier` |
| `FinancierDetail` | 6 campos | `getFinancier` |
| `PartnerStateItem` / `PartnerMunicipalityItem` | UF/nome + `isPartner` | `listPartnerStates` / `listMunicipalitiesByUf` |

## Eventos (client — Event Bus, Princ. XII)

| Evento (EN-passado) | Quando ocorre | Quem assina |
|---|---|---|
| `ColaboradorDesativado` | sucesso da desativação | view-model da lista (invalida query) |
| `FornecedorCriado` | sucesso da criação | view-model da lista |

> Opt-in: usar só onde há reação cross-feature; chamada direta + invalidação do TanStack Query é o normal.

## Notas de mapeamento (Anti-Corruption Layer)

O `server/adapters` é a **anti-corruption layer** entre o `core-api` (`/api/v1`, modelo legado) e o
domínio limpo do módulo: traduz contratos, **saneia bugs de borda** (encoding `AvaliaÃ§Ã£o` → "Avaliação")
e isola os pontos de **mock/fallback** (Estados/Municípios; import/export) — ver `api-readiness-report.md`.

**Justificativa (Anticorruption Layer)** (citação):
> New systems almost always have to be integrated with legacy or other systems, which have their own models. Translation layers can be simple, even elegant, when bridging well-designed BOUNDED CONTEXTS with cooperative teams. But when the other side of the boundary starts to leak through, the translation layer may take on a more defensive tone.
> When a new system is being built that must have a large interface with another, the difficulty of relating the two models can eventually overwhelm the intent of the new model altogether, causing it to be modified to resemble the other system's model, in an ad hoc fashion.
> — *(Linha 4997, p. 224, Eric Evans, *Domain-Driven Design*)*
