/**
 * Binding do modo EDIÇÃO do Lançar Documento ("Editar pagamento" do drawer) — ADAPTER React. Carrega o
 * documento (GET /:id), deriva os campos iniciais + as travas por campo (conforme o status) e expõe o
 * comando de AJUSTE (PATCH). No sucesso: invalida a lista + o detalhe e **redireciona pro grid**.
 *
 * Regra documentada (core-api): só "Aberto" pode ser ajustado, e só grossValue/dueDate/description aqui;
 * os demais campos são somente-consulta. Status ≠ Aberto → tela inteira somente-consulta (sem salvar).
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isOk } from '#shared/primitives/result.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type {
  AdjustDocumentInput,
  DocumentDetail,
  DocumentStatus,
} from '#modules/financial/client/data/model/document.model.ts'

import {
  hydrateFieldsFromDetail,
  editLocksFor,
  isEditableStatus,
  type DocumentFormFields,
  type FieldLocks,
} from './document-form.view.ts'
import { adjustDocumentMutationOptions } from './adjust-document.mutation.ts'

export type DocumentEditBinding = Readonly<{
  isEdit: boolean
  loading: boolean
  detail: DocumentDetail | null
  status: DocumentStatus | null
  /** Campos iniciais p/ hidratar o controller (estável até o detalhe mudar). */
  initialFields: DocumentFormFields | null
  /** Travas por campo (criação = nada travado; edição = conforme status). */
  locks: FieldLocks | null
  /** Status permite ajuste (Aberto) → mostra "Salvar alterações"; senão é só consulta. */
  editable: boolean
  running: boolean
  errorTag: string | null
  execute: (input: AdjustDocumentInput) => void
}>

export function useDocumentEditing(id: string | undefined): DocumentEditBinding {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['financial', 'documents', 'detail', id ?? null] as const,
    enabled: id !== undefined,
    queryFn: async (): Promise<DocumentDetail | null> => {
      if (id === undefined) return null
      const r = await financialRepository.getById(id)
      return isOk(r) ? r.value : null
    },
  })

  const detail = detailQuery.data ?? null

  const initialFields = useMemo(() => (detail !== null ? hydrateFieldsFromDetail(detail) : null), [detail])

  const mutation = useMutation({
    ...adjustDocumentMutationOptions,
    onSuccess: (result) => {
      if (!isOk(result)) return
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      void navigate({ to: '/financeiro/contas-a-pagar' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? financialErrorTag(data.error)
      : mutation.isError
        ? 'financial.error.server'
        : null

  return {
    isEdit: id !== undefined,
    loading: id !== undefined && detailQuery.isLoading,
    detail,
    status: detail?.status ?? null,
    initialFields,
    locks: detail !== null ? editLocksFor(detail.status) : null,
    editable: detail !== null && isEditableStatus(detail.status),
    running: mutation.isPending,
    errorTag,
    execute: (input) => {
      mutation.mutate(input)
    },
  }
}
