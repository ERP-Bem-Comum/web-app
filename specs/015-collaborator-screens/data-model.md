# Data Model — Colaborador (client)

> Modelo de leitura/escrita no client. Fonte de verdade do schema é o servidor (core-api +
> `collaborator.io.ts`). Aqui mapeamos o que a UI consome/produz. Nenhuma mudança de schema no backend.

## Entidade: Colaborador

### Campos essenciais (pré-cadastro — `CreateCollaboratorInput`)
| Campo | Tipo | Rótulo UI | Regras |
|---|---|---|---|
| `name` | string (1–200) | Representante Legal | obrigatório |
| `email` | e-mail | E-mail | obrigatório, formato e-mail |
| `cpf` | string (11–14) | CPF | obrigatório; aceita máscara, normaliza p/ dígitos |
| `occupationArea` | enum `PARC\|DDI\|DCE\|EPV` | Área | obrigatório |
| `role` | string (1–120) | Função | obrigatório |
| `startOfContract` | data `YYYY-MM-DD` | Início de Contrato | obrigatório |
| `employmentRelationship` | enum `CLT\|PJ` | Vínculo | obrigatório |

→ Resultado: colaborador com **situação `Pré Cadastrado`**.

### Campos do cadastro completo (`CompleteCollaboratorRegistrationInput`, todos opcionais)
`rg`, `dateOfBirth` (YYYY-MM-DD), `genderIdentity`, `race`, `education`, `foodCategory`,
`foodCategoryDescription`, `completeAddress`, `telephone`, `emergencyContactName`,
`emergencyContactTelephone`.

→ Ao completar, **situação passa a `Cadastrado`**. `dateOfBirth` habilita o filtro de idade (D2).

### Eixos de estado (independentes)
- **Situação cadastral** (`RegistrationStatus`): `pre-registration` → `complete`. Transição só avança.
- **Ativo/Inativo**: ativo ↔ inativo. Desativar exige **Motivo** (`DeactivationReason`, enum do servidor). Reativar disponível para inativos.

## Lista (`ListCollaboratorsInput`)
`search` (texto livre: representante legal/e-mail), `active`, `status`, `occupationAreas[]`,
`employmentRelationships[]`, `roles[]`, `yearOfContract`, `page`, `limit` (5|10|25).
Filtro de **idade**: derivado no client de `dateOfBirth` (não enviado ao servidor).

## Resultado de Importação (`importCollaborators`)
`{ created: number, failed: Array<{ line, reason }> }` — lote não aborta por linha inválida.
