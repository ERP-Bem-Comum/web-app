# Plan — Lançar Documento: OCR real (`/documents/ingest`) · #057

- **Escala:** M · **Feature dir:** `specs/057-lancar-documento-ocr/`
- **Fonte:** [[spec.md]] · core-api#62 · ADR-0009/0010/0011 · §II/§III/§IX/§XI

## Estratégia

Reusar o precedente já provado do upload binário de contratos (`attach-signed-document`): **gateway lê File →
base64 → server-fn decodifica → `octetStreamFetch` (octet-stream + metadados na query)**. O helper
`#external/core-api/octet-stream-fetch.ts` já existe e cobre POST binário → `Result<T, HttpError>` — **não é
preciso estender `resultFetch`**. Trocar o patch-in-place por navegação ao modo edição (reuso do `?id=` existente).

## Camadas e arquivos

### Server (BFF · a fronteira compõe — §III)

1. **NEW** `financial/server/adapters/ingest-document.validation.ts` — validação de borda PURA (node:test):
   decode base64, size ≤20 MiB, `mimeType` na allowlist, sanitize `fileName`. `Result<{bytes,fileName,mimeType}, 'invalid-mime'|'file-too-large'|'invalid-file'>`.
   Exporta `INGEST_MIME_ALLOWLIST` (reusada no enum Zod da fn).
2. **NEW** `financial/server/adapters/core-api/document-ingest.source.ts` — adapter fino:
   `ingestDocument(financialBase, {bytes,fileName,mimeType}, token)` → `octetStreamFetch(${base}/documents/ingest?fileName&mimeType)`
   → Zod valida `{documentId, resolvedVia}` → `Result<OcrIngestResult, 'unauthorized'|'server'>`. Mapeia HttpError (401→unauthorized; else→server).
3. **REWRITE+RENAME** `extract-document-ocr.query.fn.ts` → `ingest-document.service.fn.ts` (é escrita: cria rascunho — ADR-0010):
   input Zod `{fileName, mimeType(enum allowlist), dataBase64}`; auth (getCurrentUser + resolveAccessToken); valida;
   monta `financialBase` (coreApiBase v2 + `/financial`); chama a source; `Result`-shape `{ok,documentId,resolvedVia}` / `{ok:false,error:OcrError}`.

### Client (MVVM — núcleo agnóstico; React só no binding)

4. **REWRITE** `client/data/model/ocr.model.ts` — `OcrError` (5 variantes reais) + `OcrIngestResult`. Remove `OcrExtractedFields`/`OcrExtractionResult`.
5. **REWRITE** `client/data/ocr.gateway.ts` — `extractDocumentOcr(file)`: infere mime (MIME OU extensão; null→`err('invalid-mime')` antes de subir), lê File→base64, chama a fn, devolve `Result<OcrIngestResult, OcrError>`.
6. **REWRITE** `document-create/ocr.binding.ts` — `useOcrExtraction()`: onSuccess invalida a lista e **navega** `?id=documentId` (nunca cria doc); expõe `status` + `errorTag`.
7. **EDIT** `document-create/document-form.view.ts` — `OcrStatus` sem `unavailable` (`idle|running|done|error`); remove `ocrToFormPatch`/`ocrRetentionsToFields`/re-export `OcrExtractedFields`; add `ocrErrorTag(OcrError)`.
8. **EDIT** `document-create/document-form.controller.ts` — remove `applyPatch` + a action `patch` (órfãos após trocar o fluxo).
9. **EDIT** `document-create/components/document-preview.component.tsx` — nota por `status`+`errorTag`; `accept` = `.pdf,.xml,...`.
10. **EDIT** `document-create/page/lancar-documento.page.tsx` — `useOcrExtraction()` sem callback; passa `errorTag` ao preview.
11. **EDIT** `shared/i18n/catalog.pt-BR.ts` — `preview.done`, formatos "PDF ou XML · até 20 MB", chaves `ocr.error.*`; remove `preview.unavailable`.

## Testes

- **node:test** `tests/modules/financial/server/adapters/ingest-document.border.test.ts` — allowlist, ≤20 MiB, base64 vazia/round-trip, sanitize.
- **node:test** atualizar `document-form-view.test.ts` — remove bloco `ocrToFormPatch`.
- **vitest DOM** atualizar `document-preview.spec.tsx` — aceita `.pdf` e `.xml`; `done`/`error(errorTag)`; remove `unavailable`.
- **vitest DOM** `tests/modules/financial/client/document-create/ocr-binding.spec.tsx` — sucesso navega p/ `?id`; erro expõe tag (mocka navigate + gateway).

## Riscos / decisões

- **Sem duplicação pelo OCR:** o binding só ingere+navega; a conclusão do rascunho é a ação existente da tela. A
  eventual duplicação ao _concluir_ um rascunho (modo `draft` usa `create`) é comportamento **pré-existente** do
  app (grid Rascunho → Lançar) — fora de escopo; flag de handoff ao core-api (endpoint de finalize) se confirmado.
- **Upload binário:** resolvido reusando `octetStreamFetch` (sem tocar `resultFetch`).
- **Fluxo sensível:** mudanças aditivas; rodar `pnpm test:dom` do `document-create` + node antes de fechar.
