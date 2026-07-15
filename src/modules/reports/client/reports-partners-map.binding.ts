/**
 * Query options do mapa `id → nome` de TODOS os parceiros (agregador via public-api §I) — resolve o
 * favorecido NÃO-fornecedor (financiador/ato/colaborador) client-side nos relatórios, igual ao Contas a
 * Pagar (o read-model do backend só nomeia fornecedor). Best-effort: falha → mapa vazio (o favorecido cai
 * no nome do backend / no ref cru). Vive num `*.binding.ts` porque só a binding pode importar public-api
 * (boundary: `client-data-options` não pode). Compartilhado por Posição de Pagamentos e Fornecedores sem
 * Contrato.
 */
import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'

export const reportsPartnersMapQueryOptions = () => ({
  queryKey: ['reports', 'partners-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, string>> => {
    const r = await listAllPartnersFn()
    const map = new Map<string, string>()
    if (r.ok) for (const p of r.data) map.set(p.id, p.name)
    return map
  },
  staleTime: 60_000,
})

/** Mapa vazio estável (referência constante) — evita recomputar deps de memo quando ainda não carregou. */
export const EMPTY_PARTNERS_MAP: ReadonlyMap<string, string> = new Map()
