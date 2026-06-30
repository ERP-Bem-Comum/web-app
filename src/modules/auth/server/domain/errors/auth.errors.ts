/**
 * AuthError — união discriminada (string-literal) de falhas de auth. Slugs alinhados ao core-api
 * (ver contracts/core-api-auth.md) + locais. Mapeados para AppError/tags i18n na borda do client.
 */
export type AuthError =
  | 'invalid-credentials' // 401 login
  | 'user-disabled' // 403 login/refresh
  | 'refresh-not-found' // 401 refresh
  | 'refresh-revoked' // 401 refresh
  | 'refresh-rotated' // 401 refresh — reuse detectado: cadeia revogada → sessão morta
  | 'refresh-expired' // 401 refresh
  | 'unauthorized' // 401 /me (sem/expirado/inválido)
  | 'session-not-found' // sessão local ausente/expirada
  | 'rate-limited' // 429 — muitas tentativas (anti-brute-force do core-api)
  | 'connectivity' // backend fora / timeout
  | 'server' // 5xx / inesperado
