/**
 * Parser do envelope de erro real do core-api.
 * Contrato: { error: { code: string; message: string; requestId: string } } — sem issues[].
 * Fonte: core-api/src/shared/http/errors.ts:19-35. Usado para observabilidade/log;
 * a discriminação do AppError é por STATUS (ver map-to-app-error), não pelo slug.
 */
export type ErrorEnvelope = Readonly<{
  error: Readonly<{ code: string; message: string; requestId: string }>
}>

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

export const parseErrorEnvelope = (body: unknown): ErrorEnvelope | null => {
  if (!isRecord(body) || !isRecord(body.error)) return null
  const { code, message, requestId } = body.error
  if (typeof code !== 'string' || typeof message !== 'string' || typeof requestId !== 'string') {
    return null
  }
  return { error: { code, message, requestId } }
}
