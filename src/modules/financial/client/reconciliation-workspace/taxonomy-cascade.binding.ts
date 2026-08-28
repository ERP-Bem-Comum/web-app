/**
 * Cascata da taxonomia (5 níveis) — ADAPTER React COMPARTILHADO. Extraído do "Nova transação"
 * (`manual-entry.binding.ts`) para servir também ao "Editar" da M2 (specs/110): a mesma cascata alimenta o
 * lançamento manual, o card de Sugestão e o Buscar/Criar vários — uma regra só, sem divergir.
 *
 * Fonte das opções (ADR-0051): com um Plano Orçamentário escolhido, Centro → Categoria → Subcategoria vêm
 * da ÁRVORE daquele plano; sem plano, do catálogo operacional (`fin_categories`). Enquanto a árvore carrega,
 * as listas ficam VAZIAS — não vaza o operacional por baixo de um plano.
 *
 * O estado é dos 5 refs e as transições passam por `applyTaxonomyChange` (view-model PURA): trocar um nível
 * reseta os inferiores (RN-M2-08), e reescolher o MESMO valor não mexe em nada.
 */
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import {
  listBudgetPlansFn,
  getBudgetPlanDetailFn,
  type PlanDetail,
} from '#modules/budget-plans/public-api/index.ts'
import {
  planCostCenterOptions,
  planCategoryOptions,
  planSubcategoryOptions,
} from '#modules/financial/client/data/helpers/plan-taxonomy-cascade.ts'

import { referencesQueryOptions } from './reconciliation-workspace.query.ts'
import {
  applyTaxonomyChange,
  categoriesForCostCenter,
  hasTaxonomySelection,
  isTaxonomyPathValid,
  relabelReconCategory,
  subcategoriesOf,
  EMPTY_TAXONOMY,
  type TaxonomyLevel,
  type TaxonomyRefs,
} from './reconciliation-workspace.view-model.ts'

/** Opção de dropdown — `value` = ref (UUID) que vai ao backend. */
export type TaxonomyOption = Readonly<{ value: string; label: string }>

// Programas ATIVOS (cross-módulo via public-api) → "SIGLA — Nome". Pagina (25/página). Erro → [].
export const taxonomyProgramOptionsQuery = {
  queryKey: ['financial', 'recon', 'taxonomy-program-options'] as const,
  queryFn: async (): Promise<readonly TaxonomyOption[]> => {
    const out: TaxonomyOption[] = []
    let page = 1
    for (;;) {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page, limit: 25 } })
      if (!r.ok) break
      for (const p of r.data.items) {
        out.push({ value: p.id, label: p.sigla === '' ? p.name : `${p.sigla} — ${p.name}` })
      }
      const { total, limit } = r.data.meta
      if (r.data.items.length === 0 || page * limit >= total) break
      page += 1
    }
    return out
  },
  staleTime: 60_000,
}

// #502/S2: só planos APROVADOS (mesma regra do Lançar Documento — cenário no rótulo p/ não pegar rascunho
// homônimo por engano). RN-M2-10: o dropdown só oferece o que já existe; criar taxonomia é do Orçamento.
export const taxonomyPlanOptionsQuery = {
  queryKey: ['budget-plans', 'options', 'recon-taxonomy'] as const,
  queryFn: async (): Promise<readonly TaxonomyOption[]> => {
    const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
    if (!r.ok) return []
    return r.data.items
      .filter((p) => p.status === 'APROVADO')
      .map((p) => ({
        value: p.id,
        label:
          `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
          (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
      }))
  },
  staleTime: 60_000,
}

// O `budgetPlanRef` só vira fonte da cascata quando é UUID de verdade; vazio → cai no operacional.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string): boolean => UUID_RE.test(v)

/** Árvore do plano — só habilita com UUID válido. Mesma queryKey do documento (cache compartilhado). */
export const taxonomyPlanDetailQuery = (planoRef: string) => ({
  queryKey: ['budget-plans', 'detail', 'categorization', planoRef] as const,
  queryFn: async (): Promise<PlanDetail | null> => {
    const r = await getBudgetPlanDetailFn({ data: { id: planoRef } })
    return r.ok ? r.data : null
  },
  enabled: isPlanId(planoRef),
  staleTime: 300_000,
})

export type TaxonomyCascadeBinding = Readonly<{
  refs: TaxonomyRefs
  programOptions: readonly TaxonomyOption[]
  planoOptions: readonly TaxonomyOption[]
  costCenterOptions: readonly TaxonomyOption[]
  categoryOptions: readonly TaxonomyOption[]
  subcategoryOptions: readonly TaxonomyOption[]
  /** Muda um nível e reseta os inferiores (RN-M2-08). */
  setLevel: (level: TaxonomyLevel, value: string) => void
  /** Recomeça a partir de um estado conhecido (abrir/fechar o "Editar" — M2-1: cancelar não muda nada). */
  reset: (to?: TaxonomyRefs) => void
  /** RN-M2-09 — caminho coerente (ou tudo vazio). */
  isValid: boolean
  /** Há algo classificado (≠ operador abriu e não escolheu nada). */
  hasSelection: boolean
}>

export function useTaxonomyCascade(initial: TaxonomyRefs = EMPTY_TAXONOMY): TaxonomyCascadeBinding {
  const [refs, setRefs] = useState<TaxonomyRefs>(initial)

  const programOptions = useQuery(taxonomyProgramOptionsQuery).data ?? []
  const planoOptions = useQuery(taxonomyPlanOptionsQuery).data ?? []
  // Referências operacionais (020 · #200): a query devolve um Result → desembrulha p/ as opções.
  const referencesResult = useQuery(referencesQueryOptions()).data
  const references = referencesResult?.ok === true ? referencesResult.value : null
  const usePlan = isPlanId(refs.budgetPlanRef)
  const planDetail = useQuery(taxonomyPlanDetailQuery(refs.budgetPlanRef)).data ?? null

  const costCenterOptions: readonly TaxonomyOption[] = usePlan
    ? planDetail === null
      ? []
      : planCostCenterOptions(planDetail)
    : (references?.costCenters.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })) ?? [])
  const categoryOptions: readonly TaxonomyOption[] = usePlan
    ? planDetail === null
      ? []
      : planCategoryOptions(planDetail, refs.costCenterRef)
    : references !== null
      ? categoriesForCostCenter(references, refs.costCenterRef).map((c) => ({
          value: c.id,
          label: relabelReconCategory(c.name),
        }))
      : []
  const subcategoryOptions: readonly TaxonomyOption[] = usePlan
    ? planDetail === null
      ? []
      : planSubcategoryOptions(planDetail, refs.categoryRef)
    : references !== null
      ? subcategoriesOf(references, refs.categoryRef).map((c) => ({
          value: c.id,
          label: relabelReconCategory(c.name),
        }))
      : []

  // Identidade ESTÁVEL: a page/binding usa `reset` dentro de efeito (fechar o editor ao trocar de
  // transação) — sem `useCallback` o efeito re-dispararia a cada render.
  const setLevel = useCallback((level: TaxonomyLevel, value: string): void => {
    setRefs((prev) => applyTaxonomyChange(prev, level, value))
  }, [])
  const reset = useCallback((to: TaxonomyRefs = EMPTY_TAXONOMY): void => {
    setRefs(to)
  }, [])

  return {
    refs,
    programOptions,
    planoOptions,
    costCenterOptions,
    categoryOptions,
    subcategoryOptions,
    setLevel,
    reset,
    isValid: isTaxonomyPathValid(refs),
    hasSelection: hasTaxonomySelection(refs),
  }
}
