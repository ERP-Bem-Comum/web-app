/**
 * Server function: listar REDES disponíveis (do `GET /budget-plans/options` — #394). Fronteira RPC (§III).
 * Insumo do modal "Adicionar Orçamento" (escolher a rede). Auth no handler; erro como valor; degrada p/ [].
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import type { NetworkOption } from '#modules/budget-plans/server/domain/plan-detail.io.ts'

export type NetworkOptionView = Readonly<{ ref: string; name: string; kind: 'state' | 'municipality' }>

export const listNetworkOptionsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<readonly NetworkOptionView[]> => {
    const user = await getCurrentUserFn()
    if (user === null) return []
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return []

    const r = await budgetPlansServer().listNetworkOptions(accessToken)
    if (isErr(r)) return []
    return r.value.map((n: NetworkOption) => ({ ref: n.ref, name: n.name, kind: n.kind }))
  },
)
