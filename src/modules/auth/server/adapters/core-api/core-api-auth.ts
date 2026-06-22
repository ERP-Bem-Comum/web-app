/**
 * Cliente HTTP do core-api auth — chama `/api/v2/auth/*` via `external/core-api` (resultFetch).
 * Converte o envelope de erro do backend (por `code`) em `AuthError`. NUNCA lança (tudo é `Result`).
 * Server-only (server/adapters). Contrato: contracts/core-api-auth.md.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'
import type {
  Approver,
  AuthTokens,
  AuthUser,
  PasswordPolicy,
} from '#modules/auth/server/domain/session/session.types.ts'
import { ApproversSchema, AuthTokensSchema, MeSchema, PasswordPolicySchema } from './auth.schema.ts'

// Slugs do core-api → AuthError do nosso domínio (ver contracts/core-api-auth.md).
const SLUG_TO_AUTH_ERROR: Partial<Record<string, AuthError>> = {
  'invalid-credentials': 'invalid-credentials',
  'user-disabled': 'user-disabled',
  'refresh-token-not-found': 'refresh-not-found',
  'refresh-token-revoked': 'refresh-revoked',
  'refresh-token-rotated': 'refresh-rotated',
  'refresh-token-expired': 'refresh-expired',
  unauthorized: 'unauthorized',
}

const mapHttpToAuthError = (e: HttpError): AuthError => {
  switch (e.kind) {
    case 'http': {
      const slug = parseErrorEnvelope(e.body)?.error.code
      const mapped = slug === undefined ? undefined : SLUG_TO_AUTH_ERROR[slug]
      return mapped ?? 'server'
    }
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

const toTokens = (r: Result<unknown, HttpError>): Result<AuthTokens, AuthError> => {
  if (isErr(r)) return err(mapHttpToAuthError(r.error))
  const parsed = AuthTokensSchema.safeParse(r.value)
  return parsed.success ? ok(parsed.data) : err('server')
}

export type CoreApiAuthClient = Readonly<{
  login: (input: Readonly<{ email: string; password: string }>) => Promise<Result<AuthTokens, AuthError>>
  refresh: (refreshToken: string) => Promise<Result<AuthTokens, AuthError>>
  logout: (refreshToken: string) => Promise<Result<void, AuthError>>
  me: (accessToken: string) => Promise<Result<AuthUser, AuthError>>
  getPasswordPolicy: () => Promise<Result<PasswordPolicy, AuthError>>
  listApprovers: (accessToken: string) => Promise<Result<readonly Approver[], AuthError>>
}>

// `baseUrl` = .../api/v2 (auth). `baseUrlV1` = .../api/v1 — onde vivem os aprovadores (#148).
export const createCoreApiAuthClient = (baseUrl: string, baseUrlV1: string): CoreApiAuthClient => ({
  login: async ({ email, password }) =>
    toTokens(
      await resultFetch<unknown>(`${baseUrl}/auth/login`, { method: 'POST', body: { email, password } }),
    ),

  refresh: async (refreshToken) =>
    toTokens(
      await resultFetch<unknown>(`${baseUrl}/auth/refresh`, { method: 'POST', body: { refreshToken } }),
    ),

  logout: async (refreshToken) => {
    const r = await resultFetch<unknown>(`${baseUrl}/auth/logout`, { method: 'POST', body: { refreshToken } })
    return isErr(r) ? err(mapHttpToAuthError(r.error)) : ok(undefined)
  },

  me: async (accessToken) => {
    const r = await resultFetch<unknown>(`${baseUrl}/auth/me`, { method: 'GET', token: accessToken })
    if (isErr(r)) return err(mapHttpToAuthError(r.error))
    const parsed = MeSchema.safeParse(r.value)
    return parsed.success ? ok(parsed.data) : err('server')
  },

  // Público (sem token): política de senha (#32). Valida o response na borda (§VI).
  getPasswordPolicy: async () => {
    const r = await resultFetch<unknown>(`${baseUrl}/auth/password-policy`, { method: 'GET' })
    if (isErr(r)) return err(mapHttpToAuthError(r.error))
    const parsed = PasswordPolicySchema.safeParse(r.value)
    return parsed.success ? ok(parsed.data) : err('server')
  },

  // Aprovadores elegíveis (#148): GET /api/v1/approvers (RBAC user:list). name null → fallback p/ o id.
  listApprovers: async (accessToken) => {
    const r = await resultFetch<unknown>(`${baseUrlV1}/approvers`, { method: 'GET', token: accessToken })
    if (isErr(r)) return err(mapHttpToAuthError(r.error))
    const parsed = ApproversSchema.safeParse(r.value)
    if (!parsed.success) return err('server')
    return ok(parsed.data.items.map((u) => ({ id: u.id, name: u.name ?? u.id })))
  },
})
