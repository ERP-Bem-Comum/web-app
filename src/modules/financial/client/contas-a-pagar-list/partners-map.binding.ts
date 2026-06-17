/**
 * Mapa `id → {nome, tipo}` de TODOS os parceiros (Fornecedor/Financiador/Ato) p/ resolver o `supplierRef`
 * do grid e do drawer (o DTO da lista só traz o id — FIN-LIST-DTO #47). Agrega via public-api de Parceiros
 * (§I). ACT exibe a RAZÃO SOCIAL (corporateName). O `kind` pinta o avatar pela regra de cor do parceiro.
 */
import {
  listSuppliersFn,
  listFinanciersFn,
  listActsFn,
  getActFn,
} from '#modules/partners/public-api/index.ts'

import type { PartnerKind } from './contas-a-pagar.view-model.ts'

export type PartnerRef = Readonly<{ name: string; kind: PartnerKind; document: string }>

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
    if (suppliers.ok)
      for (const s of suppliers.data.items)
        map.set(s.id, { name: s.name, kind: 'supplier', document: s.cnpj })
    if (financiers.ok)
      for (const f of financiers.data.items)
        map.set(f.id, { name: f.name, kind: 'financier', document: f.cnpj })
    // ActListItem não traz CNPJ (só o ActDetail) — busca os detalhes (são poucos Atos) p/ exibir o CNPJ
    // junto à razão social, igual fornecedor/financiador.
    if (acts.ok) {
      const details = await Promise.all(acts.data.items.map((a) => getActFn({ data: { id: a.id } })))
      for (const d of details) {
        if (d.ok) map.set(d.data.id, { name: d.data.corporateName, kind: 'act', document: d.data.cnpj })
      }
    }
    return map
  },
  staleTime: 60_000,
}
