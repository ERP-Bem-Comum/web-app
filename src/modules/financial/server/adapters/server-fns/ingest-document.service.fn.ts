/**
 * Server function: INGERIR um documento por OCR (Lançar Documento, core-api#62). Fronteira RPC (§III) — a
 * ÚNICA borda entre o client e o serviço de ingestão. Recebe o arquivo como base64 (o gateway lê o File no
 * browser), decodifica → bytes, valida na borda (§IX: Zod + allowlist/tamanho) e faz `POST /documents/ingest`
 * (octet-stream) via a source. O backend CRIA UM RASCUNHO pré-preenchido e devolve `{ documentId, resolvedVia }`.
 * É uma ESCRITA (persiste um rascunho) → `.service.fn.ts` (ADR-0010). RBAC `fiscal-document:write` (401/403).
 * Erros como valores (§II): allowlist/tamanho/arquivo/auth/servidor viram variantes de `OcrError`.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import {
  validateIngestDocument,
  INGEST_MIME_ALLOWLIST,
} from '#modules/financial/server/adapters/ingest-document.validation.ts'
import { ingestDocument } from '#modules/financial/server/adapters/core-api/document-ingest.source.ts'

// OcrError (server) — espelha 1:1 o `OcrError` do client/data/model (client e server não se importam).
export type OcrError = 'invalid-mime' | 'file-too-large' | 'invalid-file' | 'unauthorized' | 'server'

export type IngestDocumentFnResult =
  | Readonly<{ ok: true; documentId: string; resolvedVia: 'xml' | 'native-text' | null }>
  | Readonly<{ ok: false; error: OcrError }>

const IngestDocumentInputSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  // Allowlist no enum da borda (§IX): nada fora de pdf/xml chega ao backend.
  mimeType: z.enum(INGEST_MIME_ALLOWLIST),
  dataBase64: z.string().trim().min(1),
})

export const ingestDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(IngestDocumentInputSchema)
  .handler(async ({ data }): Promise<IngestDocumentFnResult> => {
    try {
      const user = await getCurrentUserFn()
      const accessToken = await resolveAccessTokenFn()
      if (user === null || accessToken === null) return { ok: false, error: 'unauthorized' }

      // Borda: decodifica base64 → bytes, checa allowlist/tamanho, sanitiza o nome (§IX).
      const validated = validateIngestDocument({
        dataBase64: data.dataBase64,
        fileName: data.fileName,
        mimeType: data.mimeType,
      })
      if (isErr(validated)) return { ok: false, error: validated.error }

      const env = loadEnvOrThrow()
      const financialBase = `${coreApiBase(env.CORE_API_URL, 'v2')}/financial`

      const r = await ingestDocument(financialBase, validated.value, accessToken)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, documentId: r.value.documentId, resolvedVia: r.value.resolvedVia }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error('[ingest-document] erro inesperado:', message)
      return { ok: false, error: 'server' }
    }
  })
