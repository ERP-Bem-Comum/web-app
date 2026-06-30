# API Mapping — core-api #32 (wire) ↔ domínio do front

Casar campo a campo no implement contra `core-api/src/modules/contracts/adapters/http/{contract-dto,schemas}.ts` (branch `feat/backlog-front-handoff`).

> **Confirmado no implement (T001/T002):**
> - `classification: 'CT' | 'OS'` no response. `programId`/`budgetPlanId` **crus presentes** (UUID|null). `categorizacao`/`centroDeCusto` string|null.
> - Bloco **`program: { id: uuid, snapshot: { name, sigla, programNumber } | null } | null`** — a **sigla** está em `program.snapshot.sigla` (aninhada). Mapeada para o domínio `program: { id, name, sigla }`.
> - Listagem de programas (D8): `listProgramsFn` (já no `#modules/programs/public-api`), `ProgramListItem = { id: uuid, sigla, ... }`. Wired no `contract-create.binding` (`useContractProgramOptionsBinding`).

## READ — response de contrato (list-item + detalhe)

| #32 (wire) | Tipo wire | Domínio front (`Contract`) | Tipo front | Transform |
|---|---|---|---|---|
| `sequentialNumber` | `string` (`"1/2026"`) | `sequentialNumber` | `string` | direto; formatação na UI via `formatContractNumber(code, classification)` |
| `classification` | `'CT'\|'OS'` | `classification` | `'Contract'\|'ServiceOrder'` | CT→Contract, OS→ServiceOrder (default Contract) |
| `program` (bloco) | `{ id: uuid, <sigla> }` | `program` | `{ id: string, name: string }?` | bloco→objeto; sigla→`name` |
| `programId` | `uuid \| null` | `programId` | `string?` | `?? undefined` |
| `budgetPlanId` | `uuid \| null` | `budgetPlanId` | `string?` | `?? undefined` |
| `categorizacao` | `string \| null` | `categorizacao` | `string?` | `?? undefined` |
| `centroDeCusto` | `string \| null` | `centroDeCusto` | `string?` | `?? undefined` |

> Todos os novos campos: `.nullable().optional()` no Zod do BFF (backward-compat). **D9**: o `discriminatedUnion` de status ganha branch de escape (`status: z.string()`) + `safeParse` por item → `'Cancelled'` (#32) não quebra o grid; o mapper degrada status desconhecido sem zerar a linha (UI de cancelamento = slice futuro). IDs sempre `z.uuid()` (ADR-0013).

## WRITE — `POST /contracts` (#32 `createContractBodySchema`)

| Front (`CreateContractInput`) | Body #32 | Observação |
|---|---|---|
| — | `mode: 'Pending'` | fixo nesta fatia (D7) |
| ~~`sequentialNumber`~~ | **(não enviar)** | removido (backend gera) |
| `classification` `'Contract'/'ServiceOrder'` | `classification: 'CT'/'OS'` | mapear ServiceOrder→OS, senão CT |
| `programId: string?` (UUID) | `programId: uuid?` | do seletor real (D8); omitir se vazio |
| `budgetPlanId: string?` | `budgetPlanId: uuid?` | opcional nesta fatia |
| `categorizacao/centroDeCusto: string?` | idem | string livre |
| `title/objective/originalValueCents/period/contractor` | idem (já enviados) | inalterado |

- Modo **Active** (`mode:'Active'` + `signedAt`) do #32: **não usado** nesta fatia (D7 — cadastro+assinatura segue via activate em 2 passos).
- Resposta do create = contract list-item → parsear com `CoreApiContractListItemSchema` (já inclui os novos campos após esta fatia) e exibir número/classificação reais.

## Seletor de Programa (D8)
- Fonte: listagem de programas via `#modules/programs/public-api` (confirmar contrato no implement). Opções `{ value: program.id (uuid), label: program.sigla }`.
