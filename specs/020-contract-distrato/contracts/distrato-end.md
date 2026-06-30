# Contrato: encerramento por distrato (BFF ↔ core-api)

> O browser fala **só** com a server function `end-contract` (única fronteira). Ela orquestra dois passos no core-api `/api/v2`. O core-api **não muda** (entregue no #32).

## Sequência (ordem OBRIGATÓRIA)

```
contract-detail.page (chaining após homologar o aditivo de distrato)
  → endCommand.execute({ contractId, file, terminatedAt, reason })   [client]
  → end-contract.mutation → repository.endContract(input)
  → endContractFn({ data: EndContractInput })                        [server fn — Zod na borda]
        1. validateSignedDocument(fileBase64, fileName, signedAt=terminatedAt)  → bytes + data não-futura
        2. contractsServer().endContract(command, token):
             a. client.uploadTerminationDocument(contractId, {bytes, fileName}, token)
                → POST /contracts/:id/documents?categoria=signed_termination&fileName&mimeType=application/pdf&signedElectronically=true
                → idempotente: 'document-conflict' não aborta
             b. client.endContract(contractId, terminatedAt, reason, token)
                → POST /contracts/:id/end  { kind:'Terminate', terminatedAt:'YYYY-MM-DD', reason }
  → Result<Contract, ContractsError>
  → onSuccess: invalida ['contracts','detail',id] + ['contracts','list']
```

## Passo 2a — upload do documento de distrato

`POST /api/v2/contracts/:id/documents` (octet-stream)

- Query: `categoria=signed_termination`, `fileName=<sanitizado>`, `mimeType=application/pdf`, `signedElectronically=true`.
  - ⚠️ a query de documento de **contrato** (`uploadDocumentQuerySchema`) **NÃO** exige `signedAt` (diferente da de aditivo).
- Body: bytes do PDF (`application/octet-stream`).
- Resposta: documento criado (validado por `CoreApiDocumentSchema`).
- Erros mapeados: `storage-*` → `storage-unavailable`; `document-*` → `document-conflict` (não aborta); magic-bytes → `invalid-pdf`.

## Passo 2b — encerrar

`POST /api/v2/contracts/:id/end`

Request body (discriminated union por `kind`):
```json
{ "kind": "Terminate", "terminatedAt": "2026-06-10", "reason": "Rescisão amigável conforme cláusula X" }
```

Regras (validadas no core-api):
- `terminatedAt`: `string().min(1)`; data válida e **não-futura** (vs `clock.now()`), senão **422 `terminate-invalid-date`**.
- `reason`: `string().min(1)`, senão **400** (Zod).
- documento `signed_termination` Active vinculado ao contrato é pré-requisito, senão **422 `terminate-no-signed-document`**.
- contrato precisa estar Ativo, senão **409**/`ContractNotActive` → `contract-not-active`.

Resposta `200`: list-item do contrato com `status: "Terminated"` (+ `endedAt` = data efetiva). Validado por `CoreApiContractListItemSchema` → `apiContractToDomain` → `status: 'Distrato'`.

## EndContractInput (Zod — `contracts.schemas.ts`)

```ts
export const EndContractInputSchema = z.object({
  contractId: z.uuid(),
  fileBase64: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(255).regex(/^[^/\\:*?"<>|]+$/, 'invalid-file-name'),
  terminatedAt: z.string().trim().min(1), // YYYY-MM-DD; data válida/não-futura checada na borda da fn
  reason: z.string().trim().min(1),
})
// drift guard: AssertEqual<z.infer<typeof EndContractInputSchema>, D.EndContractInput> = true
```

## Mapa de erros → tag i18n (UI nunca vê status HTTP)

| `ContractsError` | tag i18n | mensagem (pt-BR) |
|---|---|---|
| `terminate-no-document` | `contracts.distrato.error.no-document` | "É necessário anexar o documento assinado de distrato para encerrar o contrato." |
| `terminate-invalid-date` | `contracts.distrato.error.invalid-date` | "Data efetiva do distrato inválida (não pode ser futura)." |
| `invalid-pdf` / `file-too-large` | `contracts.attach.error.*` (existentes) | — |
| `contract-not-active` | `contracts.error.contract-not-active` (existente) | — |
| `connectivity` / `server` | `contracts.error.connectivity` / `.unexpected` (existentes) | — |
