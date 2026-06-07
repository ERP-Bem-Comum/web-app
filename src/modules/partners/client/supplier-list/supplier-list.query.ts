/**
 * Query options da listagem de fornecedores — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { supplierRepository } from '#modules/partners/client/data/repository/supplier.repository.instance.ts'
import type { SupplierListFilters } from '#modules/partners/client/domain/supplier.schemas.ts'

export const supplierListQueryKey = (input: SupplierListFilters) =>
  ['suppliers', 'list', input] as const

export const supplierListQueryOptions = (input: SupplierListFilters) => ({
  queryKey: supplierListQueryKey(input),
  queryFn: () => supplierRepository.list(input),
})

export const serviceCategoriesQueryKey = ['suppliers', 'service-categories'] as const

export const serviceCategoriesQueryOptions = () => ({
  queryKey: serviceCategoriesQueryKey,
  queryFn: () => supplierRepository.categories(),
  // tabela de referência praticamente estática — `'static'` evita o refetch a cada montagem
  // (list/create/edit) e não é re-disparada pela invalidação global pós-mutation.
  staleTime: 'static' as const,
})
