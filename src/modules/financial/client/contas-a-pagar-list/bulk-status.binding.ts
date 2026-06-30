/**
 * Binding de "Mudar Status" em MASSA — ADAPTER React. Aplica `approve` (Aberto→Aprovado) ou
 * `undo-approval` (Aprovado→Aberto) a cada linha selecionada, levando o `version` (optimistic lock) de
 * cada uma. Erros são VALORES (sem throw): roda `Promise.all`, conta as falhas (ex.: 409 de versão) e,
 * no fim, invalida a lista + o detalhe. Se tudo passou, chama `onCompleted` (a page limpa a seleção).
 *
 * Só `approve`/`undo-approval` existem na borda HTTP; submit/pay/transmit/reconcile seguem chrome (#91 etc.).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

import type { StatusTarget } from './contas-a-pagar.view-model.ts'

type BulkResult = readonly Result<DocumentDetail, FinancialError>[]

const failures = (data: BulkResult | undefined): number =>
  data === undefined ? 0 : data.filter((r) => !isOk(r)).length

export type BulkStatusBinding = Readonly<{
  approve: (targets: readonly StatusTarget[]) => void
  reopen: (targets: readonly StatusTarget[]) => void
  running: boolean
  errorTag: string | null
}>

export function useBulkStatus(onCompleted: () => void): BulkStatusBinding {
  const queryClient = useQueryClient()

  const afterRun = (data: BulkResult): void => {
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
    // #201: o grid por título também reflete a transição.
    void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
    if (failures(data) === 0) onCompleted()
  }

  const approveMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-approve'] as const,
    mutationFn: (targets: readonly StatusTarget[]): Promise<BulkResult> =>
      Promise.all(targets.map((t) => financialRepository.approve(t))),
    onSuccess: afterRun,
  })
  const reopenMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-reopen'] as const,
    mutationFn: (targets: readonly StatusTarget[]): Promise<BulkResult> =>
      Promise.all(targets.map((t) => financialRepository.undoApproval(t))),
    onSuccess: afterRun,
  })

  const running = approveMut.isPending || reopenMut.isPending
  const failed = failures(approveMut.data) + failures(reopenMut.data)
  const errorTag = running || failed === 0 ? null : 'financial.list.status.bulkError'

  return {
    approve: (targets) => {
      if (targets.length > 0) approveMut.mutate(targets)
    },
    reopen: (targets) => {
      if (targets.length > 0) reopenMut.mutate(targets)
    },
    running,
    errorTag,
  }
}
