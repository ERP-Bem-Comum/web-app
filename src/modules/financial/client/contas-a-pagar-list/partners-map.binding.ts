/**
 * Mapa `id → nome` de TODOS os parceiros (Fornecedor/Financiador/Ato) p/ resolver o `supplierRef` do grid
 * e do drawer (o DTO da lista só traz o id — FIN-LIST-DTO #47). Agrega via public-api de Parceiros (§I).
 * ACT exibe a RAZÃO SOCIAL (corporateName), consistente com o picker do Lançar.
 */
import { listSuppliersFn, listFinanciersFn, listActsFn } from '#modules/partners/public-api/index.ts'

const PAGE = { active: true, limit: 100 } as const

export const partnersMapQueryOptions = {
  queryKey: ['financial', 'partners-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, string>> => {
    const [suppliers, financiers, acts] = await Promise.all([
      listSuppliersFn({ data: PAGE }),
      listFinanciersFn({ data: PAGE }),
      listActsFn({ data: PAGE }),
    ])
    const map = new Map<string, string>()
    if (suppliers.ok) for (const s of suppliers.data.items) map.set(s.id, s.name)
    if (financiers.ok) for (const f of financiers.data.items) map.set(f.id, f.name)
    if (acts.ok) for (const a of acts.data.items) map.set(a.id, a.corporateName)
    return map
  },
  staleTime: 60_000,
}
