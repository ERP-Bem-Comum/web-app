/**
 * Guarda do "Voltar para edição" (spec 119, P.O. 19/10) — ADAPTER React.
 *
 * Antes de devolver documentos para edição, lê a trilha de cada um: se algum JÁ teve baixa ou transmissão
 * desfeita, abre o alerta reforçado (o pagamento pode ter acontecido no banco); senão, segue direto, como
 * sempre foi. Operação fora da rotina tem que PARECER fora da rotina — e só quando é.
 *
 * Trilha que não pôde ser lida conta como "teve": na dúvida, avisar custa um clique; não avisar pode custar
 * um pagamento em dobro.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'

import { hadUndoInHistory, type StatusTarget } from './contas-a-pagar.view-model.ts'

export type ReopenGuardBinding = Readonly<{
  /** Pede para voltar para edição: checa a trilha e ou segue direto, ou abre o alerta. */
  request: (targets: readonly StatusTarget[]) => void
  /** Documentos aguardando confirmação no alerta; `null` = alerta fechado. */
  pending: readonly StatusTarget[] | null
  checking: boolean
  confirm: () => void
  cancel: () => void
}>

export function useReopenGuard(proceed: (targets: readonly StatusTarget[]) => void): ReopenGuardBinding {
  const [pending, setPending] = useState<readonly StatusTarget[] | null>(null)

  const check = useMutation({
    mutationKey: ['financial', 'documents', 'reopen-guard'] as const,
    mutationFn: async (targets: readonly StatusTarget[]): Promise<boolean> => {
      const timelines = await Promise.all(targets.map((t) => financialRepository.getTimeline(t.id)))
      return timelines.some((r) => !r.ok || hadUndoInHistory(r.value.map((e) => e.eventType)))
    },
    onSuccess: (hadUndo, targets) => {
      if (hadUndo) setPending(targets)
      else proceed(targets)
    },
  })

  return {
    request: (targets) => {
      if (targets.length > 0) check.mutate(targets)
    },
    pending,
    checking: check.isPending,
    confirm: () => {
      if (pending !== null) proceed(pending)
      setPending(null)
    },
    cancel: () => {
      setPending(null)
    },
  }
}
