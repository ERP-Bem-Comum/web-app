# Contrato: `attachSignedDocumentFn` (server function — comando)

**Arquivo**: `src/modules/contracts/server/adapters/server-fns/attach-signed-document.service.fn.ts`
**Espelha**: `create-contract.service.fn.ts`
**Sufixo**: `*.service.fn.ts` (comando/efeito — §III)

## Assinatura

```ts
createServerFn({ method: 'POST' })
  .inputValidator(AttachSignedDocumentInputSchema)   // Zod (data-model.md)
  .handler(async ({ data }): Promise<AttachSignedDocumentFnResult> => { ... })
```

```ts
type AttachSignedDocumentFnResult =
  | { ok: true; data: Contract }            // contrato efetivado (status 'Em Andamento')
  | { ok: false; error: ContractsError }    // união discriminada de valores
```

## Comportamento (handler)

1. **Auth** (espelha create): `getCurrentUserFn()` + `resolveAccessTokenFn()`; se nulos → `{ ok:false, error:'unauthorized' }`. (Fn protegida faz auth própria — §IX.)
2. **Validação de borda** (após Zod): decodifica `fileBase64` → bytes; checa magic bytes `%PDF` (`invalid-pdf`), tamanho ≤20MiB (`file-too-large`), `signedAt` válida e não-futura (`invalid-signed-at`/`signed-at-in-future`), `fileName` sanitizado. Falhas → `{ ok:false, error }` sem chamar o backend.
3. **Orquestra via BFF**: `contractsServer().attachSignedDocument(contractId, { bytes, fileName, signedAt }, token)`:
   - `POST /contracts/:id/documents` (octet-stream + query `categoria=signed_contract&fileName=..&mimeType=application/pdf&signedElectronically=true`).
   - se `ok` → `POST /contracts/:id/activate` `{ signedAt }`.
   - idempotência: se documento já existe (`document-already-*`), pular upload e tentar só activate (recuperação de falha parcial — R4).
4. Converte `Result` → `{ ok, data|error }`.

## Erros mapeados (do core-api → valor)

`invalid-pdf` (422 magic-bytes) · `activate-contract-no-signed-document` (409) · `document-contract-mismatch` (409) · `document-already-deleted|superseded` (409) · `storage-*` (502/503) · `invalid-signed-at` (422) · `unauthorized` (401) · `server` (fallback). Status preservado pelo `resultFetch` (§V).

## Não-objetivos

- Não cria rota de página nova.
- Não executa "homologação" de aditivos.
- Não altera `createContractFn` (criação continua nascendo Pendente quando não há documento).

## Export (public-api)

`export { attachSignedDocumentFn } from '...server-fns/attach-signed-document.service.fn.ts'`
`export { useAttachSignedDocumentBinding } from '...contract-attach-document/attach-signed-document.binding.ts'`
