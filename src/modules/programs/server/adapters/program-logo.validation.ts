/**
 * Validação de borda do logo de Programa (server-only). Decodifica a base64 e checa: MIME permitido
 * (png/jpeg/webp), não-vazio, ≤ 5 MiB e **magic bytes** coerentes com o MIME declarado. Espelha a
 * validação do core-api (415 tipo / 413 tamanho / 422 mismatch) p/ falhar cedo. PURA (Result, sem throw).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'

export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type LogoMimeType = (typeof LOGO_MIME_TYPES)[number]

const MAX_BYTES = 5 * 1024 * 1024 // 5 MiB (igual ao core-api)

const isLogoMime = (v: string): v is LogoMimeType => (LOGO_MIME_TYPES as readonly string[]).includes(v)

// Assinatura (magic bytes) por MIME.
const matchesMagic = (bytes: Uint8Array, mime: LogoMimeType): boolean => {
  if (mime === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  // image/webp: "RIFF"…"WEBP"
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
}

export const validateProgramLogo = (
  fileBase64: string,
  mimeType: string,
): Result<Readonly<{ bytes: Uint8Array; mimeType: LogoMimeType }>, 'validation'> => {
  if (!isLogoMime(mimeType)) return err('validation')
  const bytes = new Uint8Array(Buffer.from(fileBase64, 'base64'))
  if (bytes.length === 0) return err('validation')
  if (bytes.length > MAX_BYTES) return err('validation')
  if (!matchesMagic(bytes, mimeType)) return err('validation')
  return ok({ bytes, mimeType })
}
