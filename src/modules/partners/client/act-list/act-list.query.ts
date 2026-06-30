/**
 * Query options da listagem de ACTs — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'
import type { ActListFilters } from '#modules/partners/client/data/act-list-filters.schema.ts'

export const actListQueryKey = (input: ActListFilters) => ['acts', 'list', input] as const

export const actListQueryOptions = (input: ActListFilters) => ({
  queryKey: actListQueryKey(input),
  queryFn: () => actRepository.list(input),
})
