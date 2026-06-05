/**
 * decode-access-exp — lê o `exp` do access JWT por DECODE puro (base64url do payload), **sem verificar
 * a assinatura** (R1: o BFF recebeu o token do core-api por TLS; o core-api valida de verdade). Server-only.
 * Retorna o instante de expiração em **epoch ms** (o `exp` do JWT é em segundos) ou `null` se malformado.
 */
export const decodeAccessExp = (jwt: string): number | null => {
  const parts = jwt.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8')
    const payload: unknown = JSON.parse(json)
    if (typeof payload !== 'object' || payload === null || !('exp' in payload)) return null
    const { exp } = payload as Record<'exp', unknown>
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}
