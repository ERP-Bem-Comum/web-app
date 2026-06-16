/**
 * Binding do Lançar Documento — ADAPTER React. `useMutation` → Command. No sucesso expõe o documento
 * criado + seus `payables` (estado de sucesso — FR-007). Erro → tag i18n (§V). Espelha
 * `users-create.binding.ts` (sem invalidar lista: na Fatia 1 a lista é stub).
 */
import { useMutation } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import type { CreateDocumentInput, DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'

import { createDocumentMutationOptions } from './create-document.mutation.ts'

export type LancarDocumentoCommand = Readonly<{
  running: boolean
  errorTag: string | null
  created: DocumentDetail | null
  execute: (input: CreateDocumentInput) => void
  reset: () => void
}>

export function useLancarDocumentoBinding(): LancarDocumentoCommand {
  const mutation = useMutation({ ...createDocumentMutationOptions })

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
