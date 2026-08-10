/**
 * Binding do drawer de Detalhe do Documento — ADAPTER React. Busca o detalhe (GET /:id) e resolve o nome
 * do fornecedor (mapa de Fornecedores) + a categorização (Centro de Custo / Categoria / Subcategoria /
 * Programa), entregando a view PURA (`mapDocumentDetail`). `id === null` → query desabilitada (drawer
 * fechado). Os títulos pai+filhos vêm em `view.payables`.
 *
 * #95/#147/#502: a categorização resolve PLANO-FIRST — o documento é carimbado com refs da ÁRVORE do plano
 * (Fatia 1), então busca a árvore do `budgetPlanRef` (`getBudgetPlanDetailFn`, cache compartilhado com o
 * Lançar Documento) e resolve Centro/Categoria/Subcategoria/Plano por nome; o catálogo operacional
 * (`referenceOptionsQuery`) + programas (`programOptionsQueryOptions`) ficam de FALLBACK (docs antigos).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'

import { referenceOptionsQuery } from '../document-create/category-options.binding.ts'
import { programOptionsQueryOptions, type ProgramOption } from '../document-create/program-options.binding.ts'
import { getBudgetPlanDetailFn, type PlanDetail } from '#modules/budget-plans/public-api/index.ts'
import { partnersMapQueryOptions } from './partners-map.binding.ts'
import { usePayeeBank, type PayeeBankView } from './payee-bank.binding.ts'
import {
  mapDocumentDetail,
  type CategorizationResolvers,
  type DocumentDetailView,
  type ResolveSupplier,
  type ResolveSupplierDoc,
} from './contas-a-pagar.view-model.ts'

// Só busca a árvore com um UUID de verdade (o `budgetPlanRef` do documento). Espelha o guard da Fatia 1.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string | null): v is string => v !== null && UUID_RE.test(v)

/** Rótulo do plano — mesma regra dos dropdowns ("ano sigla versão · cenário"). */
const planLabel = (p: PlanDetail): string =>
  `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
  (p.scenarioName !== null ? ` · ${p.scenarioName}` : '')

/**
 * Monta os resolvers ref→nome. **#502: PLANO-FIRST** — desde a Fatia 1 o documento é carimbado com refs da
 * ÁRVORE do plano (não do catálogo operacional); então resolvemos primeiro contra a árvore do plano do
 * documento (`plan`), com o catálogo operacional (`refs`) como FALLBACK (docs antigos / lançamentos manuais).
 * `budgetPlan` deixa de ser "—": resolve o rótulo do plano carimbado. Maps p/ lookup O(1).
 */
const buildCategorizationResolvers = (
  refs: FinancialReferences | undefined,
  programs: readonly ProgramOption[] | undefined,
  plan: PlanDetail | null | undefined,
): CategorizationResolvers => {
  // Operacional (fallback).
  const opCategoryById = new Map(
    (refs?.categories ?? []).map((c) => [c.id, { name: c.name, parentId: c.parentId }]),
  )
  const opCostCenterById = new Map((refs?.costCenters ?? []).map((c) => [c.id, c.name]))
  const programById = new Map((programs ?? []).map((p) => [p.id, p.name]))

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
    budgetPlan: (ref) => (ref === plan?.id ? planLabel(plan) : null),
  }
}

export type DocumentDetailBinding = Readonly<{
  view: DocumentDetailView | null
  payeeBank: PayeeBankView | null
  loading: boolean
}>

export function useDocumentDetail(id: string | null): DocumentDetailBinding {
  const partners = useQuery(partnersMapQueryOptions)
  const references = useQuery(referenceOptionsQuery)
  const programs = useQuery(programOptionsQueryOptions)
  const detail = useQuery({
    queryKey: ['financial', 'documents', 'detail', id] as const,
    enabled: id !== null,
    queryFn: async (): Promise<DocumentDetail | null> => {
      if (id === null) return null
      const r = await financialRepository.getById(id)
      return isOk(r) ? r.value : null
    },
  })
  // Árvore do plano CARIMBADO no documento (#502): resolve Centro/Categoria/Subcategoria/Plano por nome
  // (o documento guarda refs da árvore, não do catálogo operacional). Compartilha o cache da Fatia 1
  // (mesma queryKey). Só busca com UUID válido; sem plano → cai no operacional (fallback).
  const budgetPlanRef = detail.data?.budgetPlanRef ?? null
  const plan = useQuery({
    queryKey: ['budget-plans', 'detail', 'categorization', budgetPlanRef] as const,
    enabled: isPlanId(budgetPlanRef),
    queryFn: async (): Promise<PlanDetail | null> => {
      if (!isPlanId(budgetPlanRef)) return null
      const r = await getBudgetPlanDetailFn({ data: { id: budgetPlanRef } })
      return r.ok ? r.data : null
    },
    staleTime: 300_000,
  })
  // Mapeia FORA da queryFn (resolve nome + CNPJ do fornecedor pelo mapa) — view PURA, sem deps na key.
  const resolve: ResolveSupplier = (ref) => (ref === null ? '—' : (partners.data?.get(ref)?.name ?? ref))
  const resolveDoc: ResolveSupplierDoc = (ref) =>
    ref === null ? null : (partners.data?.get(ref)?.document ?? null)
  // Resolvers de categorização (ref→nome), memoizados enquanto as fontes não mudam. Plano-first + fallback op.
  const catResolvers = useMemo(
    () => buildCategorizationResolvers(references.data, programs.data, plan.data ?? null),
    [references.data, programs.data, plan.data],
  )
  const view = detail.data != null ? mapDocumentDetail(detail.data, resolve, resolveDoc, catResolvers) : null
  // Banco/PIX do favorecido resolvidos CLIENT-SIDE (sem core-api#95) — kind sai do partners-map.
  const supplierRef = detail.data?.supplierRef ?? null
  const kind = supplierRef !== null ? (partners.data?.get(supplierRef)?.kind ?? null) : null
  const payeeBank = usePayeeBank(supplierRef, kind)
  return { view, payeeBank, loading: id !== null && detail.isLoading }
}
