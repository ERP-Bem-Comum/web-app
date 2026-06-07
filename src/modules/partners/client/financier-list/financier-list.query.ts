/**
 * Query options da listagem de financiadores — AGNÓSTICO (puro, zero React). Sobre o repository.
 * Espelha `supplier-list.query.ts`, sem a query de categorias (financiador não tem categorias).
 */
import { financierRepository } from '#modules/partners/client/data/repository/financier.repository.instance.ts'
import type { FinancierListFilters } from '#modules/partners/client/domain/financier.schemas.ts'

export const financierListQueryKey = (input: FinancierListFilters) =>
  ['financiers', 'list', input] as const

export const financierListQueryOptions = (input: FinancierListFilters) => ({
  queryKey: financierListQueryKey(input),
  queryFn: () => financierRepository.list(input),
})
