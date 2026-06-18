/**
 * Mapa `id → {nome, tipo, documento}` de TODOS os parceiros (os 4 tipos) p/ resolver o `supplierRef` do
 * grid e do drawer (o DTO da lista só traz o id — FIN-LIST-DTO #47). Usa o agregador `listAllPartnersFn`
 * (UMA chamada, via public-api §I) com `document` já resolvido (CNPJ p/ PJ, CPF p/ colaborador). Inclui
 * inativos (um documento pode referenciar parceiro depois desativado). O `kind` pinta o avatar pela cor.
 */
import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'

import type { PartnerKind } from './contas-a-pagar.view-model.ts'

export type PartnerRef = Readonly<{ name: string; kind: PartnerKind; document: string }>

export const partnersMapQueryOptions = {
  queryKey: ['financial', 'partners-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, PartnerRef>> => {
    const r = await listAllPartnersFn()
    const map = new Map<string, PartnerRef>()
    if (!r.ok) return map
    for (const p of r.data) map.set(p.id, { name: p.name, kind: p.kind, document: p.document })
    return map
  },
  staleTime: 60_000,
}
