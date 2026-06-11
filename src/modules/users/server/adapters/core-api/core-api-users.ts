/**
 * Cliente HTTP do core-api para Users — chama `/api/v1/users`. NUNCA lança (tudo é Result; mappers
 * retornam Result, sem `throw`). Server-only (adapters). Anti-corruption layer: traduz o contrato REAL
 * do core-api ↔ Model do front (status active|disabled → activation, meta harmonizada) e mapeia o
 * envelope de erro para `UsersError`.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import { resultFetch } from '#external/core-api/result-fetch.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'
import type { UserClient } from '#modules/users/server/application/users.use-cases.ts'
import type { ListUsersInput, UserListItem, UserListResponse, UserDetail } from '#modules/users/server/domain/user.io.ts'
import { CoreApiUserListSchema, CoreApiCreatedUserSchema, CoreApiUserDetailSchema, type CoreApiUserItem, type CoreApiUserDetail } from './users.schema.ts'

const SLUG_TO_ERROR: Partial<Record<string, UsersError>> = {
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  // Criação: email já cadastrado (409) → mensagem específica na UI.
  'email-already-registered': 'email-taken',
  // Troca de senha: senha atual incorreta / senha vazada-comum.
  'invalid-credentials': 'invalid-current-password',
  'password-too-common': 'password-weak',
  'password-too-short': 'password-too-short',
}

const statusToError = (status: number, slug: string | undefined): UsersError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 404) return 'not-found'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

const mapHttpError = (e: HttpError): UsersError => {
  switch (e.kind) {
    case 'http':
      return statusToError(e.status, parseErrorEnvelope(e.body)?.error.code)
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

// ── Mappers: API → Model ─────────────────────────────────────────────────────
const itemToModel = (u: CoreApiUserItem): UserListItem => ({
  id: u.id,
  name: u.name ?? '—',
  email: u.email,
  activation: u.status === 'active' ? 'active' : 'inactive',
})

const detailToModel = (raw: unknown): Result<UserDetail, UsersError> => {
  const parsed = CoreApiUserDetailSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato
  const d: CoreApiUserDetail = parsed.data
  return ok({
    id: d.id,
    name: d.name ?? '',
    email: d.email,
    cpf: d.cpf ?? '',
    telephone: d.telephone ?? '',
    imageUrl: d.imageUrl,
    active: d.active,
    massApprovalPermission: d.massApprovalPermission,
  })
}

const listToModel = (raw: unknown): Result<UserListResponse, UsersError> => {
  const parsed = CoreApiUserListSchema.safeParse(raw)
  if (!parsed.success) return err('server') // drift de contrato
  const m = parsed.data.meta
  return ok({
    items: parsed.data.items.map(itemToModel),
    meta: { page: m.currentPage, limit: m.itemsPerPage, total: m.totalItems },
  })
}

const buildListQuery = (input: ListUsersInput): string => {
  const p = new URLSearchParams()
  p.set('page', String(input.page))
  p.set('pageSize', String(input.pageSize))
  p.set('status', input.status)
  if (input.search !== undefined && input.search !== '') p.set('search', input.search)
  return p.toString()
}

// `baseUrl` é a base /api/v1 (usuários + /me). `authBaseUrl` é a base /api/v2 (auth/change-password),
// pois a troca de senha vive no plugin de auth (`${authBaseUrl}/auth/change-password`).
export const createCoreApiUsersClient = (baseUrl: string, authBaseUrl: string): UserClient => {
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` })
  return {
    list: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/users?${buildListQuery(input)}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return listToModel(r.value)
    },
    create: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/users`, {
        method: 'POST',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      const parsed = CoreApiCreatedUserSchema.safeParse(r.value)
      if (!parsed.success) return err('server') // drift de contrato
      return ok({ id: parsed.data.id })
    },
    getById: async (id, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/users/${id}`, {
        method: 'GET',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    update: async (id, input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/users/${id}`, {
        method: 'PUT',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    setActive: async (id, active, token) => {
      const action = active ? 'activate' : 'deactivate'
      const r = await resultFetch<unknown>(`${baseUrl}/users/${id}/${action}`, {
        method: 'PATCH',
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    getMe: async (token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/me`, { method: 'GET', headers: auth(token) })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    updateMe: async (input, token) => {
      const r = await resultFetch<unknown>(`${baseUrl}/me`, { method: 'PUT', body: input, headers: auth(token) })
      if (isErr(r)) return err(mapHttpError(r.error))
      return detailToModel(r.value)
    },
    changePassword: async (input, token) => {
      // POST /api/v2/auth/change-password → 204 (sem corpo). Revoga todas as sessões (logout no front).
      const r = await resultFetch<unknown>(`${authBaseUrl}/auth/change-password`, {
        method: 'POST',
        body: input,
        headers: auth(token),
      })
      if (isErr(r)) return err(mapHttpError(r.error))
      return ok(undefined)
    },
  }
}
