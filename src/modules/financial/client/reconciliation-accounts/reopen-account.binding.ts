/**
 * useReopenAccount — reabrir conta-cedente (POST /cedente-accounts/:id/reopen, core-api#995 B1).
 *
 * ⚠️ SEM MODAL DE CONFIRMAÇÃO, e é decisão, não esquecimento. Reabrir é o caminho de RECUPERAÇÃO de
 * quem encerrou por engano — foi exatamente o que aconteceu em produção em 06/09/2026 — e é
 * trivialmente desfazível: basta encerrar de novo. Pôr uma confirmação aqui cobraria mais atenção para
 * desfazer um erro do que para cometê-lo, que é o avesso do que a tela deve fazer.
 *
 * Quem tem confirmação é o EXCLUIR (`useDeleteAccount`), porque aquele não volta.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'

export type ReopenAccountBinding = Readonly<{
  /** Id da conta sendo reaberta agora — a linha usa isto para desabilitar o próprio botão. */
  reopeningId: string | null
  errorTag: string | null
  reopen: (id: string) => void
  dismissError: () => void
}>

export function useReopenAccount(): ReopenAccountBinding {
  const qc = useQueryClient()
  const [reopeningId, setReopeningId] = useState<string | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (id: string) => reconciliationRepository.reopenAccount(id),
    onSuccess: (res) => {
      setReopeningId(null)
      if (res.ok) {
        setErrorTag(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    reopeningId,
    errorTag,
    reopen: (id) => {
      if (mut.isPending) return
      setErrorTag(null)
      setReopeningId(id)
      mut.mutate(id)
    },
    dismissError: () => {
      setErrorTag(null)
    },
  }
}
