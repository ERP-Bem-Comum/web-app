/**
 * Binding do drawer de Detalhe do Documento — ADAPTER React. Busca o detalhe (GET /:id) e resolve o nome
 * do fornecedor (mapa de Fornecedores), entregando a view PURA (`mapDocumentDetail`). `id === null` →
 * query desabilitada (drawer fechado). Os títulos pai+filhos vêm em `view.payables`.
 */
import { useQuery } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'

import { partnersMapQueryOptions } from './partners-map.binding.ts'
import { usePayeeBank, type PayeeBankView } from './payee-bank.binding.ts'
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
  const view = detail.data != null ? mapDocumentDetail(detail.data, resolve, resolveDoc) : null
  // Banco/PIX do favorecido resolvidos CLIENT-SIDE (sem core-api#95) — kind sai do partners-map.
  const supplierRef = detail.data?.supplierRef ?? null
  const kind = supplierRef !== null ? (partners.data?.get(supplierRef)?.kind ?? null) : null
  const payeeBank = usePayeeBank(supplierRef, kind)
  return { view, payeeBank, loading: id !== null && detail.isLoading }
}
