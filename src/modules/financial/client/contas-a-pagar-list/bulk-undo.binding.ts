/**
 * Binding do DESFAZER BAIXA em massa (spec 119 / core-api#61) — ADAPTER React. Pago → status anterior
 * à baixa, UMA chamada por título,
 * com o MESMO motivo para o lote todo.
 *
 * `Promise.all` e não sequência encadeada (como a baixa): o core-api desfaz por título com CAS no próprio
 * título e não altera a versão do documento, então irmãos do mesmo documento não disputam nada.
 *
 * As falhas são REPORTADAS por título, no molde do `bulk-status.binding.ts`: todas as recusas chegam
 * como 409 → `conflict`, e só a MENSAGEM do core-api diz qual foi e o que fazer — "desfaça a
 * conciliação antes". Um "algumas falharam" não diria.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialFailure } from '#modules/financial/client/data/model/remittance.model.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'

import type { UndoTarget } from './contas-a-pagar.view-model.ts'
import type { BulkFailure } from './bulk-status.binding.ts'

type BulkResult = readonly Result<DocumentDetail, FinancialFailure>[]
type UndoVars = Readonly<{ targets: readonly UndoTarget[]; reason: string }>

export type BulkUndoBinding = Readonly<{
  undoPayment: (targets: readonly UndoTarget[], reason: string) => void
  running: boolean
  /** Cabeçalho do bloco de erros; `null` quando nada falhou. O detalhe vem em `failures`. */
  errorTag: string | null
  /** Uma entrada por título que falhou, na ordem da seleção. Vazio quando tudo passou. */
  failures: readonly BulkFailure[]
}>

// Casa resultado com alvo pelo ÍNDICE — `Promise.all` preserva a ordem de entrada.
const collectFailures = (
  data: BulkResult | undefined,
  targets: readonly UndoTarget[],
): readonly BulkFailure[] => {
  if (data === undefined) return []
  const out: BulkFailure[] = []
  data.forEach((r, i) => {
    if (isOk(r)) return
    out.push({
      documentNumber: targets[i]?.documentNumber ?? targets[i]?.payableId ?? '—',
      message: r.error.message,
      tag: financialErrorTag(r.error.error),
    })
  })
  return out
}

export function useBulkUndo(onCompleted: () => void): BulkUndoBinding {
  const queryClient = useQueryClient()

  const afterRun = (data: BulkResult): void => {
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
    void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
    // O Histórico do documento ganhou um marco (com motivo) — a aba precisa reler.
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'timeline'] })
    if (data.every(isOk)) onCompleted()
  }

  const toInput = (t: UndoTarget, reason: string) => ({
    documentId: t.documentId,
    payableId: t.payableId,
    version: t.version,
    reason,
  })

  const paymentMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-undo-payment'] as const,
    mutationFn: ({ targets, reason }: UndoVars): Promise<BulkResult> =>
      Promise.all(targets.map((t) => financialRepository.undoManualPayment(toInput(t, reason)))),
    onSuccess: afterRun,
  })

  const running = paymentMut.isPending
  const failures = running ? [] : [...collectFailures(paymentMut.data, paymentMut.variables?.targets ?? [])]

  return {
    undoPayment: (targets, reason) => {
      if (targets.length > 0) paymentMut.mutate({ targets, reason })
    },
    running,
    errorTag: failures.length === 0 ? null : 'financial.list.undo.bulkError',
    failures,
  }
}
