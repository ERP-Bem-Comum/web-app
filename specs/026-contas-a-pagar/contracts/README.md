# Contratos — Contas a Pagar (Fase 1)

A **fronteira** do front é a **server function** (§III). Cada fn declara intenção pelo sufixo (`*.query.fn.ts` leitura · `*.service.fn.ts` comando) e devolve o envelope RPC `{ ok: true, data } | { ok: false, error: FinancialError }`. Validação Zod no **input** e no **response** do core-api (§IX). A UI só vê `data`/`error` — nunca status HTTP (§V).

## Server functions (BFF) ↔ core-api (`/api/v2/financial`)

| Server fn | Sufixo | core-api | Input (Zod) | Output (`data`) | Erros possíveis |
|---|---|---|---|---|---|
| `listDocumentsFn` | `.query.fn` | `GET /documents` | `ListDocumentsInput` | `DocumentListResponse` (**vazio na Fatia 1**) | `unauthorized`, `forbidden`, `connectivity`, `server` |
| `getDocumentFn` | `.query.fn` | `GET /documents/:id` | `{ id }` | `DocumentDetail` | `not-found`, `unauthorized`, `forbidden`, `connectivity`, `server` |
| `createDocumentFn` | `.service.fn` | `POST /documents` (`asDraft:false`) | `CreateDocumentInput` | `DocumentDetail` (201; corpo do documento) | `net-value-invalid`, `retention-not-allowed`, `document-incomplete`, `validation`, `unauthorized`, `forbidden`, `connectivity`, `server` |
| `adjustDocumentFn` | `.service.fn` | `PATCH /documents/:id` | `AdjustDocumentInput` | `DocumentDetail` | `not-found`, `invalid-transition`, `net-value-invalid`, `retention-not-allowed`, `validation`, `conflict`, … |
| `approveDocumentFn` | `.service.fn` | `POST /documents/:id/approve` | `ApproveInput` | `DocumentDetail` | `not-found`, `invalid-transition`, `forbidden`, … |
| `undoApprovalFn` | `.service.fn` | `POST /documents/:id/undo-approval` | `ApproveInput` | `DocumentDetail` | `not-found`, `invalid-transition`, `forbidden`, … |
| `cancelDocumentFn` | `.service.fn` | `DELETE /documents/:id` | `CancelInput` | `void` (204) | `not-found`, `invalid-transition`, `forbidden`, … |

> **v1 de UI** usa só `listDocumentsFn` (grid/empty) e `createDocumentFn` (lançar). As demais ficam prontas na camada server/client para a **onda 2** (drawer + ações).

## Convenções de borda (request → core-api)

- **Money**: string de **centavos** (`^\d+$`); a UI converte reais→centavos antes de submeter.
- **Datas**: `YYYY-MM-DD`.
- **Alíquota**: `rateBps` inteiro (percentual × 100).
- **RBAC** (o core-api exige; a server fn anexa o guard de auth): ler = `fiscal-document:read`; criar/ajustar = `fiscal-document:write`; aprovar/undo = `payable:approve`; cancelar = `fiscal-document:cancel`.
- **201 + Location**: o `create` devolve o documento no corpo (o BFF normaliza para `DocumentDetail`).

## Mapa de erro (core-api slug → `FinancialError` → tag i18n)

| slug core-api | status | `FinancialError` | tag i18n (ex.) |
|---|---|---|---|
| `document-not-found` | 404 | `not-found` | `financial.error.not-found` |
| `invalid-state-transition` | 409 | `invalid-transition` | `financial.error.invalid-transition` |
| `net-value-not-positive` | 422 | `net-value-invalid` | `financial.error.net-value-invalid` |
| `retention-not-allowed-for-type` | 422 | `retention-not-allowed` | `financial.error.retention-not-allowed` |
| `document-incomplete` | 422 | `document-incomplete` | `financial.error.document-incomplete` |
| `validation` / 400 / outros 422 | 400/422 | `validation` | `financial.error.validation` |
| (sem token) | 401 | `unauthorized` | (signOut + redirect /login, central) |
| (sem permissão) | 403 | `forbidden` | `financial.error.forbidden` |
| rede/timeout | — | `connectivity` | `financial.error.connectivity` |
| demais | 5xx | `server` | `financial.error.server` |

## Contrato de UI (telas)

- **Grid (`/financeiro/contas-a-pagar`)**: recebe da ViewModel `{ status: 'loading' | 'empty' | 'ready' | 'error', items, page, pageSize, total }`. Renderiza colunas (Tipo, Documento, Fornecedor, Contrato, Forma Pag., Emissão, Vencimento, Bruto, Líquido, Status), chips de status (chrome), botão "Novo Documento". **Estado vazio** quando `total = 0`.
- **Lançar Documento (`/financeiro/contas-a-pagar/lancar`)**: recebe `{ form, canSubmit, netPreview, retentionsEnabled, submitting, errorTag }` + `onSubmit(CreateDocumentInput)`. Gating de retenção por `type ∈ {NFS-e, RPA}`.
