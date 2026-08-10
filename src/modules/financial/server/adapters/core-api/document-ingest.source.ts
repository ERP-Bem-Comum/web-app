/**
 * Source do core-api para a INGESTÃO de documento por OCR (core-api#62) — adapter FINO, server-only. Faz o
 * `POST {financialBase}/documents/ingest` com corpo BINÁRIO (octet-stream) via o helper `octetStreamFetch`
 * (metadados `fileName`/`mimeType` na query, como no upload de documentos de contrato). NUNCA lança (tudo é
 * Result; `throw` só na borda do fetch). Valida o response na fronteira com Zod (§IX) e mapeia HttpError → OcrError.
 */
import * as z from 'zod'

import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import { octetStreamFetch } from '#external/core-api/octet-stream-fetch.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import type { ValidatedIngestDocument } from '../ingest-document.validation.ts'

// Resultado da ingestão: o backend CRIA UM RASCUNHO e devolve o id + como resolveu a extração.
export type OcrIngestResult = Readonly<{
  documentId: string
  resolvedVia: 'xml' | 'native-text' | null
}>

// Erros que a source pode devolver (o restante — invalid-mime/file-too-large/invalid-file — vem da validação de borda).
export type IngestSourceError = 'unauthorized' | 'server'

// Response 201 do /documents/ingest (contrato #62). `resolvedVia` pode vir null (nem XML nem texto nativo).
const IngestResponseSchema = z.object({
  documentId: z.string().trim().min(1),
  resolvedVia: z.enum(['xml', 'native-text']).nullable(),
})

const mapIngestHttpError = (e: HttpError): IngestSourceError => {
  if (e.kind === 'http' && e.status === 401) return 'unauthorized'
  return 'server'
}

export const ingestDocument = async (
  financialBase: string,
  input: ValidatedIngestDocument,
  token: string,
): Promise<Result<OcrIngestResult, IngestSourceError>> => {
  const r = await octetStreamFetch<unknown>(`${financialBase}/documents/ingest`, {
    token,
    bytes: input.bytes,
    query: { fileName: input.fileName, mimeType: input.mimeType },
    // OCR/extração pode ser mais lento que um POST comum → margem maior que o default (30s do helper).
    timeoutMs: 60_000,
  })
  if (isErr(r)) return err(mapIngestHttpError(r.error))

  const parsed = IngestResponseSchema.safeParse(r.value)
  if (!parsed.success) return err('server')
  return ok({ documentId: parsed.data.documentId, resolvedVia: parsed.data.resolvedVia })
}
