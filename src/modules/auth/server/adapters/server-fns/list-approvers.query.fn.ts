/**
 * list-approvers — server function (leitura) dos aprovadores elegíveis (#148).
 * GET /api/v1/approvers (RBAC user:list no core-api) → usuários ATIVOS com `payable:approve`. Exige sessão
 * (usa o access token resolvido server-side). Degrada para `[]` (sem auth / erro) — o dropdown some/fica
 * vazio sem quebrar o form. Sem throw fora da borda.
 */
import { createServerFn } from '@tanstack/react-start'

import { isOk } from '#shared/primitives/result.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'
import { resolveAccessTokenFn } from '#modules/auth/server/adapters/server-fns/resolve-access-token.server-fn.ts'
import type { Approver } from '#modules/auth/server/domain/session/session.types.ts'

export const listApproversFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<readonly Approver[]> => {
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return []
    const r = await authServer().listApprovers(accessToken)
    return isOk(r) ? r.value : []
  },
)
