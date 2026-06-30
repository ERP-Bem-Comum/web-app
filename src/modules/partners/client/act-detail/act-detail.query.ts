/**
 * Query options do detalhe de ACT — AGNÓSTICO (puro). Sobre o repository.
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'

export const actDetailQueryKey = (id: string) => ['acts', 'detail', id] as const

export const actDetailQueryOptions = (id: string) => ({
  queryKey: actDetailQueryKey(id),
  queryFn: () => actRepository.getById(id),
})
