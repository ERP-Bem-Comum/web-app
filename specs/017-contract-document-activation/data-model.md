# Data Model: Anexo do documento assinado e efetivação (017)

Frontend-only. "Entidades" aqui = **schemas Zod** e tipos de borda/transporte. Sem schema de banco (core-api intocado).

## Entrada da server function — `AttachSignedDocumentInput`

Validada por Zod no `inputValidator` da `attach-signed-document.service.fn.ts`.

| Campo | Tipo | Regras |
|---|---|---|
| `contractId` | `z.uuid()` | id do contrato Pendente |
| `fileBase64` | `z.string().min(1)` | conteúdo do PDF em base64 (lido de `file.arrayBuffer()` no client) |
| `fileName` | `z.string().min(1).max(255)` | sem separadores de path `/\:*?"<>\|`; derivado de `File.name` |
| `signedAt` | `z.string()` (ISO date) | obrigatória; data válida; **não-futura** (assumption) |

Validações **adicionais de borda** (após decodificar base64, fora do Zod puro — feitas no handler/VO):
- magic bytes `%PDF` (`0x25504446`) → senão `invalid-pdf`.
- tamanho dos bytes decodificados ≤ `20 * 1024 * 1024` → senão `file-too-large`.

> Observação: `signedElectronically` é fixado em `true` pelo BFF (categoria assinatura eletrônica); `mimeType` fixo `application/pdf`; `categoria` fixa `signed_contract`. Não vêm do client.

## Saída — contrato efetivado

A fn devolve `Result<Contract, ContractsError>` (o **mesmo** `Contract` do domínio do front já existente), com `status: 'Em Andamento'` e `signedAt`/`files` preenchidos. Sem tipo novo de saída — reusa o agregado de leitura existente.

## Transporte BFF ↔ core-api (consumido, não definido aqui)

### Upload — `POST /api/v2/contracts/:id/documents`
- **Body**: binário cru (`application/octet-stream`), os bytes do PDF.
- **Query**: `categoria=signed_contract` · `fileName=<...>` · `mimeType=application/pdf` · `signedElectronically=true`.
- **Resposta (201)**: `DocumentMeta` (validar com Zod, reaproveitar `CoreApiDocumentSchema`):

| Campo | Tipo |
|---|---|
| `id` | string |
| `parentType` / `parentId` | string / string |
| `categoria` | string (enum) |
| `fileName` / `mimeType` / `sizeBytes` | string / string / number |
| `hashSha256` / `bucket` / `storageKey` | string |
| `version` / `status` | number / string |
| `uploadedAt` | string (ISO) |

### Activate — `POST /api/v2/contracts/:id/activate`
- **Body** (JSON): `{ signedAt: string (ISO) }`.
- **Resposta (200)**: agregado de contrato (discriminado por `status`) — reusa `CoreApiContractListItemSchema`/detalhe já existentes; mapeado por `apiContractToDomain`.

## Erros (união discriminada de valores → tag i18n)

`ContractsError` (estender o existente). Tags em `contracts.attach.error.*`:

| Valor (kebab EN) | Origem | Tag i18n (sugerida) |
|---|---|---|
| `invalid-pdf` | borda + `document-magic-bytes-mismatch` (422) | `contracts.attach.error.invalid-pdf` |
| `file-too-large` | borda (>20MiB) | `contracts.attach.error.too-large` |
| `invalid-signed-at` / `signed-at-in-future` | borda + `activate-contract-invalid-signed-at` (422) | `contracts.attach.error.invalid-date` |
| `activate-contract-no-signed-document` | activate (409) | `contracts.attach.error.no-document` |
| `document-contract-mismatch` | upload (409) | `contracts.attach.error.conflict` |
| `document-already-deleted` / `document-already-superseded` | upload (409) | `contracts.attach.error.conflict` |
| `storage-unavailable` / `storage-upload-failed` / `storage-permission-denied` | upload (502/503) | `contracts.attach.error.storage` |
| `unauthorized` | auth | (já tratado: 401 → signOut) |
| `server` / fallback | qualquer | `contracts.attach.error.failed` |

Switch exaustivo com guarda `const _: never = x` (§IV/§V).

## Permissão (client) — `ContractPermission`

União de literais: `'contract:read' | 'contract:write' | 'contract:mass-approve'`. Helper `can(granted, 'contract:write')`. Origem: `CurrentUser.permissions`.

## Estado de UI (modal — `*.controller.ts`/`useState` local)

- `uploadedFile: File | null`, `signatureDate: string`, `isDragOver: boolean`, `submitting: boolean`, `errorTag: string | null`.
- Nada disso é server-state; vive local na view (§XI). O server-state (contrato) vem da query e é invalidado no sucesso.
