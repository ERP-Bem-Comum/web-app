/**
 * Binding de EXCLUIR (hard-delete) em massa — ADAPTER React. Cancela cada documento selecionado em
 * **Aberto** (o core-api só exclui Aberto; Rascunho dá 409 — core-api#166), levando só o `id`. Erros são
 * VALORES (sem throw): roda `Promise.all`, conta falhas e, no fim, invalida a lista + o detalhe. Se tudo
 * passou, chama `onCompleted` (a page limpa a seleção e fecha o modal). ⚠️ Hard-delete: apaga pai + filhos.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

import type { StatusTarget } from './contas-a-pagar.view-model.ts'

type DeleteResult = readonly Result<void, FinancialError>[]

const failures = (data: DeleteResult | undefined): number =>
  data === undefined ? 0 : data.filter((r) => !isOk(r)).length

export type BulkDeleteBinding = Readonly<{
  remove: (targets: readonly StatusTarget[]) => void
  running: boolean
  errorTag: string | null
}>

export function useBulkDelete(onCompleted: () => void): BulkDeleteBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-delete'] as const,
    mutationFn: (targets: readonly StatusTarget[]): Promise<DeleteResult> =>
      Promise.all(targets.map((t) => financialRepository.cancel({ id: t.id, version: t.version }))),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      // #201: grid por título também reflete a exclusão.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      if (failures(data) === 0) onCompleted()
    },
  })

  const failed = failures(mut.data)
  const errorTag = mut.isPending || failed === 0 ? null : 'financial.list.delete.error'

  return {
    remove: (targets) => {
      if (targets.length > 0) mut.mutate(targets)
    },
    running: mut.isPending,
    errorTag,
  }
}
