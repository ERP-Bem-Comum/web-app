/**
 * Binding de BAIXA MANUAL em massa ("Marcar como pago", #224) — ADAPTER React. Baixa cada título
 * selecionado (Aprovado→Pago) via POST /documents/:id/payables/:payableId/manual-payment. O `version` é
 * do DOCUMENTO (optimistic lock do agregado): títulos do MESMO documento são baixados em SEQUÊNCIA,
 * encadeando o novo `version` da resposta (senão o 2º daria 409). Documentos distintos vão em sequência
 * simples (seleções são pequenas). Erros são VALORES: conta falhas e invalida as listas no fim.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export type PayTarget = Readonly<{
  documentId: string
  payableId: string
  version: number
  paidAt: string // data de pagamento informada no modal (#232), YYYY-MM-DD
}>
type BulkResult = readonly Result<DocumentDetail, FinancialError>[]

const failures = (data: BulkResult | undefined): number =>
  data === undefined ? 0 : data.filter((r) => !isOk(r)).length

export type BulkPayBinding = Readonly<{
  pay: (targets: readonly PayTarget[]) => void
  running: boolean
  errorTag: string | null
}>

export function useBulkPay(onCompleted: () => void): BulkPayBinding {
  const queryClient = useQueryClient()

  const payMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-pay'] as const,
    mutationFn: async (targets: readonly PayTarget[]): Promise<BulkResult> => {
      // Agrupa por documento (insertion order) p/ encadear o version dentro de cada agregado.
      const byDoc = new Map<string, PayTarget[]>()
      for (const t of targets) {
        const group = byDoc.get(t.documentId) ?? []
        group.push(t)
        byDoc.set(t.documentId, group)
      }
      const results: Result<DocumentDetail, FinancialError>[] = []
      for (const group of byDoc.values()) {
        const first = group[0]
        if (first === undefined) continue
        let version = first.version
        for (const t of group) {
          const r = await financialRepository.registerManualPayment({
            documentId: t.documentId,
            payableId: t.payableId,
            version,
            paidAt: t.paidAt,
          })
          results.push(r)
          if (isOk(r)) version = r.value.version
          else break // versão defasada/erro → para o grupo (evita 409 em cascata no mesmo documento)
        }
      }
      return results
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      if (failures(data) === 0) onCompleted()
    },
  })

  const running = payMut.isPending
  const failed = failures(payMut.data)
  const errorTag = running || failed === 0 ? null : 'financial.list.status.bulkPayError'

  return {
    pay: (targets) => {
      if (targets.length > 0) payMut.mutate(targets)
    },
    running,
    errorTag,
  }
}
