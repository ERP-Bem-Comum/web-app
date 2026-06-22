/**
 * Binding de opções de CATEGORIA para a Categorização do Lançar Documento — ADAPTER React. Lista as
 * categorias da taxonomia (020 · #200, RBAC `reference:read`) p/ o dropdown editável de Categoria, que
 * envia `categoryRef` no create. Reusa a cadeia BFF das referências (`reconciliationRepository.getReferences`,
 * fan-out /categories + /cost-centers — aqui só interessa categories). Erro/loading → lista vazia.
 *
 * Obs.: o documento NÃO tem centro de custo no contrato (só categoryRef/budgetPlanRef/programRef), por isso
 * só ligamos Categoria; Centro de custo/Subcategoria/Plano seguem chrome (budget-plans pende de core-api#113).
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'

export type CategoryOption = Readonly<{ value: string; label: string }>

const categoryOptionsQueryOptions = {
  queryKey: ['financial', 'category-options'] as const,
  queryFn: async (): Promise<readonly CategoryOption[]> => {
    const r = await reconciliationRepository.getReferences()
    if (!r.ok) return []
    return r.value.categories.map((c) => ({ value: c.id, label: c.name }))
  },
  staleTime: 300_000,
}

export function useCategoryOptions(): readonly CategoryOption[] {
  const query = useQuery(categoryOptionsQueryOptions)
  return query.data ?? []
}
