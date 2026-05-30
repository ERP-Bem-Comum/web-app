/**
 * Construção de Session a partir dos tokens do core-api — política compartilhada por login e refresh.
 * Puro (domínio): recebe `accessExpMs` já decodificado (o decode do JWT é adapter; o domínio não decodifica).
 * TTLs alinhados ao core-api (access 15 min / refresh 30 dias — contracts/core-api-auth.md).
 */
import type { AuthTokens, Session, SessionId } from './session.types.ts'

export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias
export const ACCESS_FALLBACK_MS = 15 * 60 * 1000 // 15 min (fallback se o `exp` não decodificar)

export const buildSession = (
  params: Readonly<{
    sessionId: SessionId
    tokens: AuthTokens
    persistent: boolean
    nowMs: number
    accessExpMs: number | null
  }>,
): Session => ({
  sessionId: params.sessionId,
  userId: params.tokens.userId,
  accessToken: params.tokens.accessToken,
  refreshToken: params.tokens.refreshToken,
  accessExpiresAt: params.accessExpMs ?? params.nowMs + ACCESS_FALLBACK_MS,
  refreshExpiresAt: params.nowMs + REFRESH_TTL_MS,
  persistent: params.persistent,
})
