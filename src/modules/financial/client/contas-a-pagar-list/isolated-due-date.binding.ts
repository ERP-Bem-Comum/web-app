/**
 * Binding de "Alterar vencimento" por TÍTULO ISOLADO (#270) — ADAPTER React. Cada título selecionado (Aberto)
 * tem o vencimento alterado numa chamada PRÓPRIA ao `PATCH /financial/documents/:id/payables/:payableId`, que
 * **NÃO propaga** ao documento-pai nem aos irmãos (títulos são independentes — pedido da P.O.). Como não há
 * endpoint de lote isolado, fazemos fan-out (N chamadas) e contamos as falhas p/ decidir sucesso/parcial.
 * Erros como valores; invalida lista + detalhe + grid por título. (Substitui o "vencimento em lote" #162,
 * que propagava pai↔filhos via `PATCH /documents/due-date`.)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'

import type { IsolatedDueDateTarget } from './contas-a-pagar.view-model.ts'

export type IsolatedDueDateBinding = Readonly<{
  apply: (targets: readonly IsolatedDueDateTarget[], dueIso: string) => void
  running: boolean
  errorTag: string | null
}>

export function useIsolatedDueDate(onCompleted: () => void): IsolatedDueDateBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'isolated-due-date'] as const,
    mutationFn: async (
      args: Readonly<{ targets: readonly IsolatedDueDateTarget[]; dueIso: string }>,
    ): Promise<number> => {
      // Fan-out isolado: cada título é uma chamada independente (não propaga). Retorna nº de falhas.
      const results = await Promise.all(
        args.targets.map((t) =>
          financialRepository.updatePayableDueDate({
            documentId: t.documentId,
            payableId: t.payableId,
            version: t.version,
            dueDate: args.dueIso,
          }),
        ),
      )
      return results.filter((r) => !isOk(r)).length
    },
    onSuccess: (failed) => {
      // Mesmo com falha parcial, algo pode ter passado → invalida sempre.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      if (failed === 0) onCompleted()
    },
  })

  const errorTag =
    mut.isPending || mut.data === 0
      ? null
      : mut.isError
        ? 'financial.list.dueDate.error' // erro global (transporte)
        : mut.data !== undefined
          ? 'financial.list.dueDate.errorPartial' // falha parcial (alguns títulos não passaram)
          : null

  return {
    apply: (targets, dueIso) => {
      if (targets.length > 0 && dueIso !== '') mut.mutate({ targets, dueIso })
    },
    running: mut.isPending,
    errorTag,
  }
}
