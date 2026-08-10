/**
 * Binding do widget "Últimos pagamentos" (042) — ADAPTER React (ADR-0009: React SÓ aqui). Reúne:
 *  - a query dos pagamentos (Top-5 do BFF, via `recentPaymentsQueryOptions`), e
 *  - a resolução de NOMES client-side (o DTO fino traz só refs):
 *      · fornecedor → `getSupplierFn` (partners public-api, §I), UMA query por ref DISTINTO (≤5);
 *      · conta débito → `reconciliationRepository.listAccounts()` (intra-financial), UM fetch → Map
 *        id→label. Se a listagem der forbidden/erro, o Map fica vazio → conta cai p/ "—" (fallback,
 *        NÃO quebra o widget).
 * Entrega ao componente uma união discriminada `{ status, rows }` (§IV). A view-model fica pura.
 */
import { useQueries, useQuery } from '@tanstack/react-query'

import { getSupplierFn } from '#modules/partners/public-api/index.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'

import { recentPaymentsQueryOptions } from './recent-payments.query.ts'
import { toRecentPaymentRows, type RecentPaymentRow } from './recent-payments.view-model.ts'

export type RecentPaymentsStatus = 'loading' | 'forbidden' | 'error' | 'empty' | 'ready'

export type RecentPaymentsView = Readonly<{
  status: RecentPaymentsStatus
  rows: readonly RecentPaymentRow[]
}>

/** Map id→label das contas-cedente. Forbidden/erro → Map vazio (conta cai p/ "—"). staleTime alto. */
function useDebitAccountsMap(): ReadonlyMap<string, string> {
  const q = useQuery({
    queryKey: ['financial', 'recent-payments', 'accounts-map'] as const,
    queryFn: async (): Promise<ReadonlyMap<string, string>> => {
      const res = await reconciliationRepository.listAccounts()
      const map = new Map<string, string>()
      if (!res.ok) return map
      for (const a of res.value) {
        const label = a.alias !== '' ? a.alias : `${a.bankName} · ${a.accountNumber}`
        map.set(a.id, label)
      }
      return map
    },
    staleTime: 60_000,
  })
  return q.data ?? new Map<string, string>()
}

/** Map supplierRef→nome resolvendo cada ref DISTINTO com `getSupplierFn` (≤5). Falha → ref fica fora. */
function useSuppliersMap(refs: readonly string[]): ReadonlyMap<string, string> {
  const results = useQueries({
    queries: refs.map((ref) => ({
      queryKey: ['financial', 'supplier', ref] as const,
      queryFn: async (): Promise<string | null> => {
        const r = await getSupplierFn({ data: { id: ref } })
        return r.ok ? r.data.name : null
      },
      staleTime: 60_000,
    })),
  })
  const map = new Map<string, string>()
  refs.forEach((ref, i) => {
    const name = results[i]?.data
    if (name !== undefined && name !== null) map.set(ref, name)
  })
  return map
}

const distinct = (values: readonly (string | null)[]): readonly string[] =>
  Array.from(new Set(values.filter((v): v is string => v !== null)))

export function useRecentPayments(): RecentPaymentsView {
  const q = useQuery(recentPaymentsQueryOptions())
  const items = q.data?.items ?? []

  // Resolve refs distintos (≤5): fornecedores (N queries) + contas (1 fetch → Map).
  const supplierRefs = distinct(items.map((rp) => rp.supplierRef))
  const suppliers = useSuppliersMap(supplierRefs)
  const accounts = useDebitAccountsMap()

  const status: RecentPaymentsStatus = (() => {
    if (q.isLoading || q.data === undefined) return 'loading'
    if (q.data.error === 'forbidden' || q.data.error === 'unauthorized') return 'forbidden'
    if (q.data.error !== null) return 'error'
    if (q.data.items.length === 0) return 'empty'
    return 'ready'
  })()

  const rows =
    status === 'ready'
      ? toRecentPaymentRows(items, {
          resolveSupplier: (ref) => (ref !== null ? (suppliers.get(ref) ?? null) : null),
          resolveAccount: (ref) => (ref !== null ? (accounts.get(ref) ?? null) : null),
        })
      : []

  return { status, rows }
}
