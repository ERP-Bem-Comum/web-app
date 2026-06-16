/**
 * Binding do Lançar Documento — ADAPTER React. `useMutation` → Command. No SUCESSO: invalida a lista e
 * **redireciona pro grid** de Contas a Pagar (regra documentada — o documento criado aparece na lista).
 * Erro → tag i18n (§V). A lista é REAL (Fatia 2), por isso invalidamos a query.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isOk } from '#shared/primitives/result.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import type {
  CreateDocumentInput,
  DocumentDetail,
} from '#modules/financial/client/data/model/document.model.ts'

import { createDocumentMutationOptions } from './create-document.mutation.ts'

export type LancarDocumentoCommand = Readonly<{
  running: boolean
  errorTag: string | null
  created: DocumentDetail | null
  execute: (input: CreateDocumentInput) => void
  reset: () => void
}>

export function useLancarDocumentoBinding(): LancarDocumentoCommand {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...createDocumentMutationOptions,
    onSuccess: (result) => {
      if (!isOk(result)) return // erro-como-valor: a mutation resolve mesmo no err
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
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
  const created = data !== undefined && isOk(data) ? data.value : null

  return {
    running: mutation.isPending,
    errorTag,
    created,
    execute: (input) => {
      mutation.mutate(input)
    },
    reset: () => {
      mutation.reset()
    },
  }
}
