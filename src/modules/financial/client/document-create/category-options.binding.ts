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
import { getBudgetPlanDetailFn, type PlanDetail } from '#modules/budget-plans/public-api/index.ts'
import {
  planCostCenterOptions,
  planCategoryOptions,
  planSubcategoryOptions,
} from '#modules/financial/client/data/helpers/plan-taxonomy-cascade.ts'

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

// ── Cascata a partir da ÁRVORE DO PLANO (ADR-0051, Fatia 1) ──
// Com um Plano Orçamentário selecionado, os 3 dropdowns vêm da árvore CADASTRADA no Orçamento para aquele
// plano — não do catálogo operacional (`fin_categories`). Sem plano, cai no operacional (regime sem-plano do
// ADR-0051: `Estorno`/`Ajuste`, que nunca existem num plano). A troca de fonte é só no binding; a page passa
// o `planoRef` e não sabe de onde vêm as opções.

/**
 * O campo `planoOrcamentario` carrega o UUID quando escolhido no DROPDOWN, mas a hidratação por contrato
 * ainda o preenche com o NOME do cenário (inconsistência pré-existente — ver handoff no PR). Buscar a árvore
 * com um nome daria 404 e esvaziaria os dropdowns em silêncio. Por isso a fonte-plano só entra quando o valor
 * é um UUID de verdade; qualquer outra coisa (nome, vazio) cai no catálogo operacional — nunca esvazia.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string): boolean => UUID_RE.test(v)

/** Query da árvore do plano — só habilita com um UUID válido (sem plano/nome → não busca, cai no operacional). */
const planDetailQuery = (planoRef: string) => ({
  queryKey: ['budget-plans', 'detail', 'categorization', planoRef] as const,
  queryFn: async (): Promise<PlanDetail | null> => {
    const r = await getBudgetPlanDetailFn({ data: { id: planoRef } })
    return r.ok ? r.data : null
  },
  enabled: isPlanId(planoRef),
  staleTime: 300_000,
})

/**
 * Centros de custo: da árvore do plano quando há `planoRef`; senão do catálogo operacional.
 * `planoRef` vazio → a query do plano fica `enabled:false` (não busca) e devolve as opções operacionais.
 */
export function useCostCenterOptionsFromPlan(planoRef: string): readonly CategoryOption[] {
  const operational = useCostCenterOptions()
  const plan = useQuery(planDetailQuery(planoRef))
  if (!isPlanId(planoRef)) return operational
  return plan.data == null ? [] : planCostCenterOptions(plan.data)
}

export function useCategoryOptionsFromPlan(
  planoRef: string,
  costCenterRef: string,
): readonly CategoryOption[] {
  const operational = useCategoryOptions(costCenterRef)
  const plan = useQuery(planDetailQuery(planoRef))
  if (!isPlanId(planoRef)) return operational
  return plan.data == null ? [] : planCategoryOptions(plan.data, costCenterRef)
}

export function useSubcategoryOptionsFromPlan(
  planoRef: string,
  categoryRef: string,
): readonly CategoryOption[] {
  const operational = useSubcategoryOptions(categoryRef)
  const plan = useQuery(planDetailQuery(planoRef))
  if (!isPlanId(planoRef)) return operational
  return plan.data == null ? [] : planSubcategoryOptions(plan.data, categoryRef)
}
