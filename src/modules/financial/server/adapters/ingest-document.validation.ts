/**
 * Validação de borda da INGESTÃO de documento por OCR (Lançar Documento, core-api#62) — PURA (sem I/O),
 * testável por node:test. Decodifica a base64 e checa: allowlist de `mimeType` (pdf/xml), tamanho ≤20 MiB,
 * base64 não-vazia e nome de arquivo sanitizado. O backend refaz a checagem de magic-bytes/allowlist (defesa
 * em profundidade); aqui barramos cedo p/ erro-como-valor claro (§II). Espelha `attach-signed-document.validation.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'

// Allowlist EXATA do endpoint /documents/ingest (core-api#62). Reusada no enum Zod da server-fn.
export const INGEST_MIME_ALLOWLIST = ['application/pdf', 'text/xml', 'application/xml'] as const
export type IngestMimeType = (typeof INGEST_MIME_ALLOWLIST)[number]

const MAX_BYTES = 20 * 1024 * 1024 // 20 MiB (alinhado ao parser octet-stream do core-api)

// Erros da fase de validação de borda — subconjunto do `OcrError` (o restante vem da source: unauthorized/server).
export type IngestValidationError = 'invalid-mime' | 'file-too-large' | 'invalid-file'

export type IngestDocumentRaw = Readonly<{
  dataBase64: string
  fileName: string
  mimeType: string
}>

export type ValidatedIngestDocument = Readonly<{
  bytes: Uint8Array
  fileName: string
  mimeType: IngestMimeType
}>

const isAllowedMime = (m: string): m is IngestMimeType =>
  (INGEST_MIME_ALLOWLIST as readonly string[]).includes(m)

const decodeBase64 = (b64: string): Uint8Array | null => {
  try {
    const bin = atob(b64) // nativo (Node 18+/Nitro) — §VIII preferir nativo
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

const sanitizeFileName = (name: string): string =>
  name
    .replace(/[/\\:*?"<>|]/g, '_')
    .trim()
    .slice(0, 255)

export const validateIngestDocument = (
  input: IngestDocumentRaw,
): Result<ValidatedIngestDocument, IngestValidationError> => {
  if (!isAllowedMime(input.mimeType)) return err('invalid-mime')

  const bytes = decodeBase64(input.dataBase64)
  if (bytes === null || bytes.length === 0) return err('invalid-file')
  if (bytes.length > MAX_BYTES) return err('file-too-large')

  const fileName = sanitizeFileName(input.fileName)
  if (fileName.length === 0) return err('invalid-file')

  return ok({ bytes, fileName, mimeType: input.mimeType })
}
