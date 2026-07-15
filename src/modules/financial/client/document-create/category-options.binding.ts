/**
 * Bindings de opções de REFERÊNCIA para a Categorização do Lançar Documento — ADAPTER React. Categorias
 * (#200), Subcategorias (#147) e Centros de custo (#341) da taxonomia (RBAC `reference:read`), p/ a
 * cascata de 3 níveis Centro de Custo → Categoria → Subcategoria. Reusa a cadeia BFF das referências
 * (`reconciliationRepository.getReferences`, fan-out /categories + /cost-centers). Uma única query
 * compartilhada (`select` por hook) → um fetch cacheado serve os TRÊS selects. Erro/loading → [].
 *
 * A REGRA da cascata é pura e mora em `data/helpers/categorization-cascade.ts` (§XI) — compartilhada com
 * a Nova transação da Conciliação. Aqui só tem a cola React + o rótulo. Obs.: Plano segue chrome (#113).
 */
import { useQuery } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import {
  categoriesForCostCenter,
  subcategoriesOf,
} from '#modules/financial/client/data/helpers/categorization-cascade.ts'
import type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type CategoryOption = Readonly<{ value: string; label: string }>

const EMPTY: FinancialReferences = { categories: [], costCenters: [] }

// Exportada p/ reuso do MESMO cache (mesma queryKey) — ex.: resolver categorização no drawer de Detalhe
// (`contas-a-pagar-list/document-detail.binding.ts`). Um fetch serve create + drawer.
export const referenceOptionsQuery = {
  queryKey: ['financial', 'reference-options'] as const,
  queryFn: async (): Promise<FinancialReferences> => {
    const r = await reconciliationRepository.getReferences()
    return r.ok ? r.value : EMPTY
  },
  staleTime: 300_000,
}

/**
 * Categorias oferecidas p/ o centro escolhido (`''` = nenhum → todas as de topo). Nunca mostra
 * subcategoria — esse é o nível de baixo. Ver a regra (e por que ela é tolerante) no helper puro.
 */
export function useCategoryOptions(costCenterRef: string): readonly CategoryOption[] {
  const query = useQuery({
    ...referenceOptionsQuery,
    select: (refs: FinancialReferences): readonly CategoryOption[] =>
      categoriesForCostCenter(refs, costCenterRef).map((c) => ({ value: c.id, label: c.name })),
  })
  return query.data ?? []
}

/** Subcategorias da categoria escolhida (`''` = nenhuma → vazio). */
export function useSubcategoryOptions(categoryRef: string): readonly CategoryOption[] {
  const query = useQuery({
    ...referenceOptionsQuery,
    select: (refs: FinancialReferences): readonly CategoryOption[] =>
      subcategoriesOf(refs, categoryRef).map((c) => ({ value: c.id, label: c.name })),
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
