/**
 * Validação de borda do documento assinado (feature 017) — PURA (sem I/O), testável por node:test.
 * Decodifica a base64 e checa: magic bytes %PDF, tamanho ≤20 MiB, data de assinatura válida e não-futura,
 * nome de arquivo sanitizado. Retorna `Result` (constituição §II — erros como valor; sem throw).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from './contracts-shared.types.ts'

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] as const // "%PDF"
const MAX_BYTES = 20 * 1024 * 1024 // 20 MiB (alinhado ao parser octet-stream do core-api)

export type AttachSignedDocumentRaw = Readonly<{
  fileBase64: string
  fileName: string
  signedAt: string
}>

export type ValidatedSignedDocument = Readonly<{
  bytes: Uint8Array
  fileName: string
  signedAt: Date
}>

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
  name.replace(/[/\\:*?"<>|]/g, '_').trim().slice(0, 255)

export const validateSignedDocument = (
  input: AttachSignedDocumentRaw,
  now: Date,
): Result<ValidatedSignedDocument, ContractsError> => {
  const bytes = decodeBase64(input.fileBase64)
  if (bytes === null || bytes.length === 0) return err('invalid-pdf')
  if (bytes.length > MAX_BYTES) return err('file-too-large')
  const hasMagic = PDF_MAGIC.every((b, i) => bytes[i] === b)
  if (!hasMagic) return err('invalid-pdf')

  const fileName = sanitizeFileName(input.fileName)
  if (fileName.length === 0) return err('invalid-pdf')

  const signedAt = new Date(input.signedAt)
  if (Number.isNaN(signedAt.getTime())) return err('invalid-signed-at')
  if (signedAt.getTime() > now.getTime()) return err('invalid-signed-at') // assinatura é fato passado

  return ok({ bytes, fileName, signedAt })
}
