/**
 * Binding de "Alterar vencimento" por TÍTULO ISOLADO (#270) — ADAPTER React. Cada título selecionado (Aberto)
 * tem o vencimento alterado numa chamada PRÓPRIA ao `PATCH /financial/documents/:id/payables/:payableId`, que
 * **NÃO propaga** ao documento-pai nem aos irmãos (títulos são independentes — pedido da P.O.). Como não há
 * endpoint de lote isolado, N chamadas: SEQUENCIAIS por documento (o `version` é do doc e cada alteração o
 * incrementa → encadeamos a version devolvida), PARALELAS entre documentos. Contamos as falhas p/ sucesso/
 * parcial. Erros como valores; invalida lista + detalhe + grid por título. (Substitui o "vencimento em lote"
 * #162, que propagava pai↔filhos via `PATCH /documents/due-date`.)
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
      // O `version` (optimistic lock) é do DOCUMENTO e CADA alteração isolada o incrementa. Então títulos do
      // MESMO documento têm de ir em SEQUÊNCIA, encadeando a version devolvida na resposta — senão o 2º título
      // bate com version velha (conflito). Documentos DISTINTOS rodam em paralelo. Retorna o total de falhas.
      const byDoc = new Map<string, IsolatedDueDateTarget[]>()
      for (const t of args.targets) {
        const arr = byDoc.get(t.documentId)
        if (arr === undefined) byDoc.set(t.documentId, [t])
        else arr.push(t)
      }
      const failuresPerDoc = await Promise.all(
        [...byDoc.values()].map(async (group): Promise<number> => {
          let version = group[0]?.version ?? 0
          let failed = 0
          for (const t of group) {
            const res = await financialRepository.updatePayableDueDate({
              documentId: t.documentId,
              payableId: t.payableId,
              version,
              dueDate: args.dueIso,
            })
            if (isOk(res))
              version = res.value.version // nova version do documento p/ o próximo título
            else failed++
          }
          return failed
        }),
      )
      return failuresPerDoc.reduce((acc, n) => acc + n, 0)
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
