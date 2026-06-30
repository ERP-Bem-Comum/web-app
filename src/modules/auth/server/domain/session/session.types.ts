/**
 * Session (server-side) — o que o BFF guarda no SessionStore. NUNCA vai ao browser (o cookie carrega
 * só o `sessionId` opaco). `accessExpiresAt`/`refreshExpiresAt` em epoch ms. `persistent` = "lembrar
 * este dispositivo" (cookie ganha Max-Age). Tipo puro (server/domain).
 */
import type { Brand } from '#shared/primitives/brand.ts'

export type SessionId = Brand<string, 'SessionId'>

/** Tokens devolvidos pelo core-api (login/refresh). Tipo de domínio — a Zod schema (adapters) produz este shape. */
export type AuthTokens = Readonly<{ accessToken: string; refreshToken: string; userId: string }>

/**
 * Identidade exposta pelo /me do core-api. `permissions` é hint de UI para RBAC (FR-020 do módulo
 * partners) — achatadas de roles→permissions pelo backend; `[]` em falha (degradação simétrica).
 * Não é fronteira de segurança: a autorização real é server-side no core-api.
 */
export type AuthUser = Readonly<{ userId: string; permissions: readonly string[] }>

/** Política pública de senha (#32: GET /api/v2/auth/password-policy). */
export type PasswordPolicy = Readonly<{ minLength: number; maxLength: number }>

// Aprovador elegível (#148) — projeção lean p/ o dropdown (id + nome). Fonte: GET /api/v1/approvers.
export type Approver = Readonly<{ id: string; name: string }>

export type Session = Readonly<{
  sessionId: SessionId
  userId: string
  accessToken: string
  refreshToken: string
  accessExpiresAt: number
  refreshExpiresAt: number
  persistent: boolean
}>
