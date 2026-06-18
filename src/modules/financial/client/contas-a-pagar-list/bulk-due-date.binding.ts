/**
 * Binding de "Alterar vencimento" em massa — ADAPTER React. Aplica o MESMO vencimento (dueDate) a cada
 * documento selecionado em **Aberto** (o core-api só ajusta Aberto), via PATCH por id levando o `version`
 * (optimistic lock). O "lote" é N chamadas individuais (`Promise.all`) — mesmo padrão de Aprovar/Excluir;
 * core-api#162 (endpoint de lote) é só otimização futura. Erros como valores; invalida lista + detalhe.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

import type { StatusTarget } from './contas-a-pagar.view-model.ts'

type AdjustResult = readonly Result<DocumentDetail, FinancialError>[]

const failures = (data: AdjustResult | undefined): number =>
  data === undefined ? 0 : data.filter((r) => !isOk(r)).length

export type BulkDueDateBinding = Readonly<{
  apply: (targets: readonly StatusTarget[], dueIso: string) => void
  running: boolean
  errorTag: string | null
}>

export function useBulkDueDate(onCompleted: () => void): BulkDueDateBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-due-date'] as const,
    mutationFn: (
      args: Readonly<{ targets: readonly StatusTarget[]; dueIso: string }>,
    ): Promise<AdjustResult> =>
      Promise.all(
        args.targets.map((t) =>
          financialRepository.adjust({ id: t.id, version: t.version, dueDate: args.dueIso }),
        ),
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      if (failures(data) === 0) onCompleted()
    },
  })

  const failed = failures(mut.data)
  const errorTag = mut.isPending || failed === 0 ? null : 'financial.list.dueDate.error'

  return {
    apply: (targets, dueIso) => {
      if (targets.length > 0 && dueIso !== '') mut.mutate({ targets, dueIso })
    },
    running: mut.isPending,
    errorTag,
  }
}
