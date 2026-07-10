/**
 * Binding de "Alterar vencimento" em massa — ADAPTER React. Aplica o MESMO vencimento (dueDate) a cada
 * documento selecionado em **Aberto** (o core-api só ajusta Aberto), numa ÚNICA chamada ao endpoint de LOTE
 * (`PATCH /financial/documents/due-date`, #162) — cada item leva o `version` (optimistic lock). O backend
 * responde 200 com o `outcome` de cada documento (falha PARCIAL): contamos os não-`ok` p/ decidir sucesso.
 * Erros como valores; invalida lista + detalhe + grid por título.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { BulkUpdateDueDateResult } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

import type { StatusTarget } from './contas-a-pagar.view-model.ts'

type BulkResult = Result<BulkUpdateDueDateResult, FinancialError>

// Nº de itens que NÃO foram alterados: erro global (transporte/payload) conta todos; senão, os outcomes ≠ ok.
const failedCount = (res: BulkResult | undefined, requested: number): number => {
  if (res === undefined) return 0
  if (!isOk(res)) return requested
  return res.value.filter((r) => r.outcome !== 'ok').length
}

export type BulkDueDateBinding = Readonly<{
  apply: (targets: readonly StatusTarget[], dueIso: string) => void
  running: boolean
  errorTag: string | null
}>

export function useBulkDueDate(onCompleted: () => void): BulkDueDateBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-due-date'] as const,
    mutationFn: (args: Readonly<{ targets: readonly StatusTarget[]; dueIso: string }>): Promise<BulkResult> =>
      financialRepository.bulkUpdateDueDate({
        items: args.targets.map((t) => ({ id: t.id, version: t.version })),
        dueDate: args.dueIso,
      }),
    onSuccess: (res, args) => {
      // Sucesso parcial ainda mexeu em títulos → invalida sempre para refletir o que passou.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      // #201: grid por título também reflete o novo vencimento.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      if (failedCount(res, args.targets.length) === 0) onCompleted()
    },
  })

  const requested = mut.variables?.targets.length ?? 0
  const failed = failedCount(mut.data, requested)
  const errorTag =
    mut.isPending || failed === 0
      ? null
      : // Erro global (Result err) → mensagem genérica; falha parcial (outcomes ≠ ok) → mensagem específica.
        mut.data !== undefined && isOk(mut.data)
        ? 'financial.list.dueDate.errorPartial'
        : 'financial.list.dueDate.error'

  return {
    apply: (targets, dueIso) => {
      if (targets.length > 0 && dueIso !== '') mut.mutate({ targets, dueIso })
    },
    running: mut.isPending,
    errorTag,
  }
}
