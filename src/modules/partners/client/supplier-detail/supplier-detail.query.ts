/**
 * Query options do detalhe de fornecedor — AGNÓSTICO (puro). Sobre o repository.
 */
import { supplierRepository } from '#modules/partners/client/data/repository/supplier.repository.instance.ts'

export const supplierDetailQueryKey = (id: string) => ['suppliers', 'detail', id] as const

export const supplierDetailQueryOptions = (id: string) => ({
  queryKey: supplierDetailQueryKey(id),
  queryFn: () => supplierRepository.getById(id),
})
