/**
 * Binding do drawer de Detalhe do Documento — ADAPTER React. Busca o detalhe (GET /:id) e resolve o nome
 * do fornecedor (mapa de Fornecedores) + a categorização (Centro de Custo / Categoria / Subcategoria /
 * Programa), entregando a view PURA (`mapDocumentDetail`). `id === null` → query desabilitada (drawer
 * fechado). Os títulos pai+filhos vêm em `view.payables`.
 *
 * #95/#147: a categorização reutiliza as MESMAS fontes do Lançar Documento (mesmas queryKeys, cache
 * compartilhado, sem fetch novo): `referenceOptionsQuery` (categorias + centros de custo) e
 * `programOptionsQueryOptions` (programas). Plano Orçamentário segue "—" (budget-plans pende core-api#113).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'

import { referenceOptionsQuery } from '../document-create/category-options.binding.ts'
import { programOptionsQueryOptions, type ProgramOption } from '../document-create/program-options.binding.ts'
import { partnersMapQueryOptions } from './partners-map.binding.ts'
import { usePayeeBank, type PayeeBankView } from './payee-bank.binding.ts'
import {
  mapDocumentDetail,
  type CategorizationResolvers,
  type DocumentDetailView,
  type ResolveSupplier,
  type ResolveSupplierDoc,
} from './contas-a-pagar.view-model.ts'

// Monta os resolvers ref→nome a partir das listas de referência (Maps p/ lookup O(1)). `budgetPlan`
// sempre null: não há fonte de planos no front hoje (core-api#113) → o drawer degrada p/ "—".
const buildCategorizationResolvers = (
  refs: FinancialReferences | undefined,
  programs: readonly ProgramOption[] | undefined,
): CategorizationResolvers => {
  const categoryById = new Map(
    (refs?.categories ?? []).map((c) => [c.id, { name: c.name, parentId: c.parentId }]),
  )
  const costCenterById = new Map((refs?.costCenters ?? []).map((c) => [c.id, c.name]))
  const programById = new Map((programs ?? []).map((p) => [p.id, p.name]))
  return {
    costCenter: (ref) => costCenterById.get(ref) ?? null,
    categoryNode: (ref) => categoryById.get(ref) ?? null,
    program: (ref) => programById.get(ref) ?? null,
    budgetPlan: () => null,
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
  // Mapeia FORA da queryFn (resolve nome + CNPJ do fornecedor pelo mapa) — view PURA, sem deps na key.
  const resolve: ResolveSupplier = (ref) => (ref === null ? '—' : (partners.data?.get(ref)?.name ?? ref))
  const resolveDoc: ResolveSupplierDoc = (ref) =>
    ref === null ? null : (partners.data?.get(ref)?.document ?? null)
  // Resolvers de categorização (ref→nome), memoizados enquanto as listas de referência não mudam.
  const catResolvers = useMemo(
    () => buildCategorizationResolvers(references.data, programs.data),
    [references.data, programs.data],
  )
  const view = detail.data != null ? mapDocumentDetail(detail.data, resolve, resolveDoc, catResolvers) : null
  // Banco/PIX do favorecido resolvidos CLIENT-SIDE (sem core-api#95) — kind sai do partners-map.
  const supplierRef = detail.data?.supplierRef ?? null
  const kind = supplierRef !== null ? (partners.data?.get(supplierRef)?.kind ?? null) : null
  const payeeBank = usePayeeBank(supplierRef, kind)
  return { view, payeeBank, loading: id !== null && detail.isLoading }
}
