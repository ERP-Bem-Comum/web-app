/**
 * Mapa `contractRef → número do contrato` (ex.: "0003/2026") p/ a coluna Contrato do grid de Contas a
 * Pagar. O DTO da lista financeira (012/#47) traz só o `contractRef` (uuid); resolvemos o número via a
 * public-api de Contratos (§I) — mesmo padrão do [[partners-map.binding]].
 */
import { listContractsFn } from '#modules/contracts/public-api/index.ts'

const PAGE = { page: 1, limit: 100, order: 'DESC' } as const

export const contractsMapQueryOptions = {
  queryKey: ['financial', 'contracts-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, string>> => {
    const r = await listContractsFn({ data: PAGE })
    const map = new Map<string, string>()
    if (r.ok) for (const c of r.data.items) map.set(c.id, c.sequentialNumber)
    return map
  },
  staleTime: 60_000,
}
