/**
 * Mapa `id → {nome, tipo}` de TODOS os parceiros (Fornecedor/Financiador/Ato) p/ resolver o `supplierRef`
 * do grid e do drawer (o DTO da lista só traz o id — FIN-LIST-DTO #47). Agrega via public-api de Parceiros
 * (§I). ACT exibe a RAZÃO SOCIAL (corporateName). O `kind` pinta o avatar pela regra de cor do parceiro.
 */
import { listSuppliersFn, listFinanciersFn, listActsFn } from '#modules/partners/public-api/index.ts'

import type { PartnerKind } from './contas-a-pagar.view-model.ts'

export type PartnerRef = Readonly<{ name: string; kind: PartnerKind }>

const PAGE = { active: true, limit: 100 } as const

export const partnersMapQueryOptions = {
  queryKey: ['financial', 'partners-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, PartnerRef>> => {
    const [suppliers, financiers, acts] = await Promise.all([
      listSuppliersFn({ data: PAGE }),
      listFinanciersFn({ data: PAGE }),
      listActsFn({ data: PAGE }),
    ])
    const map = new Map<string, PartnerRef>()
    if (suppliers.ok) for (const s of suppliers.data.items) map.set(s.id, { name: s.name, kind: 'supplier' })
    if (financiers.ok)
      for (const f of financiers.data.items) map.set(f.id, { name: f.name, kind: 'financier' })
    if (acts.ok) for (const a of acts.data.items) map.set(a.id, { name: a.corporateName, kind: 'act' })
    return map
  },
  staleTime: 60_000,
}
