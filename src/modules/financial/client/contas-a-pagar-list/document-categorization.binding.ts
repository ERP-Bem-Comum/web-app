/**
 * Categorização de um documento (Programa / Plano Orçamentário / Centro de Custo / Categoria /
 * Subcategoria) — ADAPTER React COMPARTILHADO. Extraído do drawer de Detalhe (#95/#147/#502) para que a
 * Conciliação exiba a MESMA taxonomia ao lado do título sugerido, sem duplicar a resolução ref→nome.
 *
 * #502: resolve PLANO-FIRST — o documento é carimbado com refs da ÁRVORE do plano, então a árvore do
 * `budgetPlanRef` manda; o catálogo operacional (`referenceOptionsQuery`) + programas ficam de FALLBACK
 * (docs antigos / lançamentos manuais). Todas as queries compartilham a queryKey do drawer → sem refetch.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { getBudgetPlanDetailFn, type PlanDetail } from '#modules/budget-plans/public-api/index.ts'

import { referenceOptionsQuery } from '../document-create/category-options.binding.ts'
import { programOptionsQueryOptions, type ProgramOption } from '../document-create/program-options.binding.ts'
import {
  resolveCategorization,
  type CategorizationResolvers,
  type CategorizationView,
} from './contas-a-pagar.view-model.ts'

// Só busca a árvore com um UUID de verdade (o `budgetPlanRef` do documento).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string | null): v is string => v !== null && UUID_RE.test(v)

/**
 * Rótulo do plano — "ano SIGLA versão · cenário". ⚠️ `programAbbreviation` vem `null` do detalhe do plano
 * POR CONTRATO nesta fase (`plan-detail.io.ts`), então o rótulo caía no nome por extenso ("2026 Grande Obra
 * Demais 1.0"). Como já carregamos o catálogo de programas aqui, resolvemos a sigla pelo NOME antes de
 * desistir — o plano não expõe `programRef`. Cadeia: abreviação do plano → sigla do catálogo → nome.
 */
const planLabel = (p: PlanDetail, siglaByProgramName: ReadonlyMap<string, string>): string => {
  const abbr = p.programAbbreviation ?? siglaByProgramName.get(p.programName) ?? p.programName
  return (
    `${String(p.year)} ${abbr} ${p.version.toFixed(1)}` +
    (p.scenarioName !== null ? ` · ${p.scenarioName}` : '')
  )
}

/**
 * Monta os resolvers ref→nome. **PLANO-FIRST** (#502): a árvore do plano do documento primeiro, o catálogo
 * operacional como fallback. `budgetPlan` resolve o rótulo do plano carimbado. Maps p/ lookup O(1). PURA.
 */
export const buildCategorizationResolvers = (
  refs: FinancialReferences | undefined,
  programs: readonly ProgramOption[] | undefined,
  plan: PlanDetail | null | undefined,
): CategorizationResolvers => {
  // Operacional (fallback).
  const opCategoryById = new Map(
    (refs?.categories ?? []).map((c) => [c.id, { name: c.name, parentId: c.parentId }]),
  )
  const opCostCenterById = new Map((refs?.costCenters ?? []).map((c) => [c.id, c.name]))
  // Programa exibe a SIGLA (padrão do sistema — mesmo critério do dropdown do Lançar Documento e de
  // Contratos); só cai no nome por extenso quando o cadastro não tem sigla.
  const programById = new Map((programs ?? []).map((p) => [p.id, p.sigla !== '' ? p.sigla : p.name]))
  const siglaByProgramName = new Map(
    (programs ?? []).flatMap((p) => (p.sigla !== '' ? [[p.name, p.sigla] as const] : [])),
  )

  // Árvore do plano (prioritária). Subcategoria aponta p/ a categoria-pai (o drawer decodifica a folha por
  // `parentId`); categoria = topo (parentId null).
  const planCostCenterById = new Map<string, string>()
  const planCategoryById = new Map<string, { name: string; parentId: string | null }>()
  if (plan != null) {
    for (const cc of plan.costCenters) {
      planCostCenterById.set(cc.ref, cc.name)
      for (const cat of cc.categories) {
        planCategoryById.set(cat.ref, { name: cat.name, parentId: null })
        for (const sub of cat.subCategories) {
          planCategoryById.set(sub.ref, { name: sub.name, parentId: cat.ref })
        }
      }
    }
  }

  return {
    costCenter: (ref) => planCostCenterById.get(ref) ?? opCostCenterById.get(ref) ?? null,
    categoryNode: (ref) => planCategoryById.get(ref) ?? opCategoryById.get(ref) ?? null,
    program: (ref) => programById.get(ref) ?? null,
    budgetPlan: (ref) => (ref === plan?.id ? planLabel(plan, siglaByProgramName) : null),
  }
}

/** Query do detalhe do documento — MESMA key do drawer (cache compartilhado, sem request duplicado). */
export const documentDetailQueryOptions = (id: string | null) => ({
  queryKey: ['financial', 'documents', 'detail', id] as const,
  enabled: id !== null,
  queryFn: async (): Promise<DocumentDetail | null> => {
    if (id === null) return null
    const r = await financialRepository.getById(id)
    return isOk(r) ? r.value : null
  },
})

/** Árvore do plano CARIMBADO no documento — cache compartilhado com o Lançar Documento e o drawer. */
export const planCategorizationQueryOptions = (budgetPlanRef: string | null) => ({
  queryKey: ['budget-plans', 'detail', 'categorization', budgetPlanRef] as const,
  enabled: isPlanId(budgetPlanRef),
  queryFn: async (): Promise<PlanDetail | null> => {
    if (!isPlanId(budgetPlanRef)) return null
    const r = await getBudgetPlanDetailFn({ data: { id: budgetPlanRef } })
    return r.ok ? r.data : null
  },
  staleTime: 300_000,
})

export type DocumentCategorizationBinding = Readonly<{
  /** `null` enquanto não há documento (id null) ou o detalhe ainda não chegou. */
  view: CategorizationView | null
  loading: boolean
}>

/**
 * Categorização de UM documento pelo id. `id === null` → queries desabilitadas (nada a resolver).
 * Cada linha degrada p/ "—" quando a ref é null OU não resolve (front-first tolerante).
 */
export function useDocumentCategorization(id: string | null): DocumentCategorizationBinding {
  const references = useQuery(referenceOptionsQuery)
  const programs = useQuery(programOptionsQueryOptions)
  const detail = useQuery(documentDetailQueryOptions(id))
  const plan = useQuery(planCategorizationQueryOptions(detail.data?.budgetPlanRef ?? null))
  const resolvers = useMemo(
    () => buildCategorizationResolvers(references.data, programs.data, plan.data ?? null),
    [references.data, programs.data, plan.data],
  )
  const doc = detail.data ?? null
  return {
    view: doc !== null ? resolveCategorization(doc, resolvers) : null,
    loading: id !== null && detail.isLoading,
  }
}
