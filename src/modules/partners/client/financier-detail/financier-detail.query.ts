/**
 * Query options do detalhe de financiador — AGNÓSTICO (puro). Sobre o repository.
 */
import { financierRepository } from '#modules/partners/client/data/repository/financier.repository.instance.ts'

export const financierDetailQueryKey = (id: string) => ['financiers', 'detail', id] as const

export const financierDetailQueryOptions = (id: string) => ({
  queryKey: financierDetailQueryKey(id),
  queryFn: () => financierRepository.getById(id),
})
