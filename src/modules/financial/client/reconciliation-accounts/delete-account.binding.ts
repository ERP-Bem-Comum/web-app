/**
 * useDeleteAccount — excluir conta-cedente (DELETE /cedente-accounts/:id, core-api#995 B3).
 *
 * Fluxo com CONFIRMAÇÃO, ao contrário do reabrir: excluir **não volta**. No backend é soft delete — a
 * linha vira `Deleted`, o histórico segue resolvendo e a chave natural é LIBERADA —, mas para o
 * operador o efeito é terminal: a conta some da listagem e não há caminho na tela para trazê-la de
 * volta. Espelha `useCloseAccount`.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'

export type DeleteAccountTarget = Readonly<{ id: string; alias: string }>

export type DeleteAccountBinding = Readonly<{
  /** Conta aguardando confirmação (modal aberto) — null quando fechado. */
  target: DeleteAccountTarget | null
  deleting: boolean
  errorTag: string | null
  request: (id: string, alias: string) => void
  cancel: () => void
  confirm: () => void
}>

export function useDeleteAccount(): DeleteAccountBinding {
  const qc = useQueryClient()
  const [target, setTarget] = useState<DeleteAccountTarget | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (id: string) => reconciliationRepository.deleteAccount(id),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        setTarget(null)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'accounts'] })
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    target,
    deleting: mut.isPending,
    errorTag,
    request: (id, alias) => {
      setErrorTag(null)
      setTarget({ id, alias })
    },
    cancel: () => {
      if (mut.isPending) return
      setErrorTag(null)
      setTarget(null)
    },
    confirm: () => {
      if (target === null || mut.isPending) return
      mut.mutate(target.id)
    },
  }
}
