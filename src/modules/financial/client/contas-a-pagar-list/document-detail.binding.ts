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

import { referenceOptionsQuery } from '../document-create/category-options.binding.ts'
import { programOptionsQueryOptions } from '../document-create/program-options.binding.ts'
import { partnersMapQueryOptions } from './partners-map.binding.ts'
import { usePayeeBank, type PayeeBankView } from './payee-bank.binding.ts'
import {
  buildCategorizationResolvers,
  documentDetailQueryOptions,
  planCategorizationQueryOptions,
} from './document-categorization.binding.ts'
import {
  mapDocumentDetail,
  type DocumentDetailView,
  type ResolveSupplier,
  type ResolveSupplierDoc,
} from './contas-a-pagar.view-model.ts'

export type DocumentDetailBinding = Readonly<{
  view: DocumentDetailView | null
  payeeBank: PayeeBankView | null
  loading: boolean
}>

export function useDocumentDetail(id: string | null): DocumentDetailBinding {
  const partners = useQuery(partnersMapQueryOptions)
  const references = useQuery(referenceOptionsQuery)
  const programs = useQuery(programOptionsQueryOptions)
  const detail = useQuery(documentDetailQueryOptions(id))
  // Árvore do plano CARIMBADO no documento (#502): resolve Centro/Categoria/Subcategoria/Plano por nome
  // (o documento guarda refs da árvore, não do catálogo operacional). Compartilha o cache da Fatia 1
  // (mesma queryKey). Só busca com UUID válido; sem plano → cai no operacional (fallback).
  const plan = useQuery(planCategorizationQueryOptions(detail.data?.budgetPlanRef ?? null))
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
