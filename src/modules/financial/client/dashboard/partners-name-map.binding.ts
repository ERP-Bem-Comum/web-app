/**
 * Mapa `id → nome` de TODOS os parceiros (agregador via public-api §I) para resolver o nome do fornecedor
 * no widget "Fornecedores sem Contrato" do Dashboard — mesma resiliência que o Relatório homônimo e o
 * grid de Contas a Pagar. O DTO do dashboard traz `name` do read-model (`fin_supplier_view`), que pode vir
 * NULL (event-loaded → o BFF entrega "—"); aqui o `supplierRef` é resolvido client-side pelo agregador, que
 * conhece o nome. Best-effort: falha → mapa vazio (cai no nome do backend / no ref). Vive num `*.binding.ts`
 * porque só a binding pode importar public-api (boundary).
 */
import { useQuery } from '@tanstack/react-query'

import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'

export const dashboardPartnersNameMapQueryOptions = {
  queryKey: ['financial', 'dashboard', 'partners-name-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, string>> => {
    const r = await listAllPartnersFn()
    const map = new Map<string, string>()
    if (r.ok) for (const p of r.data) map.set(p.id, p.name)
    return map
  },
  staleTime: 60_000,
}

/** Mapa vazio estável (referência constante) — evita recomputar deps quando ainda não carregou. */
export const EMPTY_NAME_MAP: ReadonlyMap<string, string> = new Map()

/** Hook de binding: mapa `id → nome` dos parceiros (best-effort; vazio enquanto carrega / em erro). */
export function useDashboardPartnerNames(): ReadonlyMap<string, string> {
  return useQuery(dashboardPartnersNameMapQueryOptions).data ?? EMPTY_NAME_MAP
}
