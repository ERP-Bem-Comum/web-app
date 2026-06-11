# Contrato consumido: rotas do core-api (NÃO alterar)

Métodos novos no BFF `src/modules/contracts/server/adapters/core-api/core-api-contracts.ts`. Reaproveitam o `authHeader(token)` e a cadeia `Result`/`HttpError` (§V).

## `uploadDocument(contractId, { bytes, fileName }, token): Result<DocumentMeta, ContractsError>`

- **Rota**: `POST {baseUrl}/contracts/{contractId}/documents`
- **Helper**: novo helper de **binário** em `src/external/core-api/` (octet-stream), **não** o `resultFetch` (que injeta `application/json`).
- **Headers**: `authHeader(token)` + `Content-Type: application/octet-stream`.
- **Query string**: `categoria=signed_contract` · `fileName=<encodeURIComponent>` · `mimeType=application/pdf` · `signedElectronically=true`.
- **Body**: `Uint8Array` (bytes do PDF, ≤20 MiB).
- **Resposta 201**: `DocumentMeta` → validar com `CoreApiDocumentSchema` (Zod) — §IX validação no response.
- **Erros**: `document-magic-bytes-mismatch` (422), `document-contract-mismatch` (409), `document-already-deleted|superseded` (409), `storage-*` (502/503).

## `activate(contractId, { signedAt }, token): Result<Contract, ContractsError>`

- **Rota**: `POST {baseUrl}/contracts/{contractId}/activate`
- **Helper**: `resultFetch` normal (JSON).
- **Headers**: `authHeader(token)` (o `resultFetch` injeta `content-type: application/json` — **não** repetir, senão 415).
- **Body**: `{ signedAt: string }` (ISO).
- **Resposta 200**: agregado de contrato → `apiContractToDomain` (reusa `CoreApiContractListItemSchema`/detalhe).
- **Pré-condição**: documento `signed_contract` já enviado; senão `activate-contract-no-signed-document` (409).
- **Erros**: `activate-contract-no-signed-document` (409), `activate-contract-invalid-signed-at` (422).

## `attachSignedDocument(contractId, { bytes, fileName, signedAt }, token): Result<Contract, ContractsError>` (orquestração)

Composição (R3):
```
1. r1 = uploadDocument(contractId, { bytes, fileName }, token)
   - se err 'document-already-superseded'|'já existe' → seguir p/ activate (idempotência R4)
   - se err outro → return err
2. r2 = activate(contractId, { signedAt }, token)
3. return r2   // contrato efetivado (Em Andamento)
```

## Permissão

Ambas as rotas exigem `contract:write` no core-api (preHandler `authorize`). O admin de dev já tem (`AUTH_SEED_JSON`).

## baseUrl / prefixo

`contractsHttpPlugin` é montado sem prefixo explícito → **`/api/v2`**. O `baseUrl` do BFF de contracts já aponta para a base correta (reusar o existente; confirmar em `core-api-contracts.ts`).
