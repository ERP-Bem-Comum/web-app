/**
 * Bindings de opções de REFERÊNCIA para a Categorização do Lançar Documento — ADAPTER React. Categorias
 * (#200) e Centros de custo (#147) da taxonomia (RBAC `reference:read`), p/ os dropdowns editáveis de
 * Categoria (envia `categoryRef`) e Centro de custo (envia `costCenterRef`). Reusa a cadeia BFF das
 * referências (`reconciliationRepository.getReferences`, fan-out /categories + /cost-centers). Uma única
 * query compartilhada (`select` por hook) → um fetch cacheado serve os dois selects. Erro/loading → [].
 *
 * Obs.: Subcategoria/Plano seguem chrome (budget-plans pende de core-api#113).
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type CategoryOption = Readonly<{ value: string; label: string }>

const EMPTY: FinancialReferences = { categories: [], costCenters: [] }

const referenceOptionsQuery = {
  queryKey: ['financial', 'reference-options'] as const,
  queryFn: async (): Promise<FinancialReferences> => {
    const r = await reconciliationRepository.getReferences()
    return r.ok ? r.value : EMPTY
  },
  staleTime: 300_000,
}

export function useCategoryOptions(): readonly CategoryOption[] {
  const query = useQuery({
    ...referenceOptionsQuery,
    select: (refs: FinancialReferences): readonly CategoryOption[] =>
      refs.categories.map((c) => ({ value: c.id, label: c.name })),
  })
  return query.data ?? []
}

export function useCostCenterOptions(): readonly CategoryOption[] {
  const query = useQuery({
    ...referenceOptionsQuery,
    select: (refs: FinancialReferences): readonly CategoryOption[] =>
      refs.costCenters.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
  })
  return query.data ?? []
}
