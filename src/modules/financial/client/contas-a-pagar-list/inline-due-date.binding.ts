/**
 * Binding da edição INLINE de vencimento (grid) — ADAPTER React. Faz `PATCH` (adjust) de UM documento
 * levando o `version` (optimistic lock). Erros são VALORES (sem throw). No sucesso, invalida a lista + o
 * detalhe para a linha refletir o novo vencimento. ⚠️ O core-api só ajusta documentos em **Aberto** — a
 * view só habilita o campo nesses; lote ainda não tem endpoint (core-api#162).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'

export type InlineDueDateBinding = Readonly<{
  changeDueDate: (id: string, version: number, dueIso: string) => void
  running: boolean
  errorTag: string | null
}>

type DueArgs = Readonly<{ id: string; version: number; dueDate: string }>

export function useInlineDueDate(): InlineDueDateBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'inline-due-date'] as const,
    mutationFn: (args: DueArgs) => financialRepository.adjust(args),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      return res
    },
  })

  const failed = mut.data !== undefined && !isOk(mut.data)
  const errorTag = mut.isPending || !failed ? null : 'financial.list.dueDate.error'

  return {
    changeDueDate: (id, version, dueIso) => {
      if (dueIso !== '') mut.mutate({ id, version, dueDate: dueIso })
    },
    running: mut.isPending,
    errorTag,
  }
}
