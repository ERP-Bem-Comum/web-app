# Contrato: cancelamento de contrato (§1.7) — BFF ↔ core-api

> Frontend-only. O core-api **não muda** (#32, CTR-HTTP-CANCEL-PENDING / ADR-0039). O browser fala só com a server fn `cancel-contract`.

## Fluxo
```
contract-list (gatilho "cancelar", só p/ Pendente) → cancel-contract-modal (confirmar)
  → cancelCommand.execute(contractId)            [client]
  → cancel-contract.mutation → repository.cancelContract(contractId)
  → cancelContractFn({ data: { contractId } })   [server fn — Zod {contractId: uuid}]
        → client.cancelContract: DELETE ${baseUrl}/contracts/:id
        → 200 (Cancelled) → apiContractDetailToDomain (status 'Cancelado')
  → onSuccess: invalida ['contracts','list'] (+ ['contracts','detail',id])
```

## Endpoint
`DELETE /api/v1/contracts/:id`
- Pendente → **200** (contrato Cancelled, soft-delete; registro preservado).
- Não-Pendente → **409 `ContractNotPending`** (CONFLICT_CODES inclui também `contract-not-pending`).
- Inexistente → 404.

## Status no domínio do front
`statusApiToDomain('Cancelled') → 'Cancelado'` (antes caía no fallback 'Finalizado'). `ContractStatus` ganha `'Cancelado'` (3 schemas/tipos) e é tratado em **todos** os switches de status (badge/cor/label/chip/filtro) — o guard `never` força.

## Gating
Ação "cancelar" só p/ `status === 'Pendente'` (helper puro `canCancelContract`). A `delete-contract-modal` (hoje desabilitada) vira "cancelar contrato" (i18n `contracts.cancel.*`), habilitada só p/ Pendente.

## Erros → tag
| code | HTTP | ContractsError | tag |
|---|---|---|---|
| `ContractNotPending` / `contract-not-pending` | 409 | `contract-not-pending` (novo) | `contracts.error.contract-not-pending` ("Apenas contratos pendentes podem ser cancelados.") |
| connectivity / server | — | (existentes) | (existentes) |

## Separação do distrato
`cancelContract` (DELETE /:id, Pendente→Cancelado) é **distinto** de `endContract` (POST /:id/end, distrato — Ativo→Distrato, fatia 020). Não reutilizar/confundir.
