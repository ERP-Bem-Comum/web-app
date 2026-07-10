/**
 * useCloseAccount — encerrar conta-cedente (POST /cedente-accounts/:id/close). Fluxo com CONFIRMAÇÃO
 * (irreversível na UI — não há reabertura de conta): `request` abre o modal com o alvo; `confirm` executa
 * a mutação; sucesso → invalida o grid das contas e limpa o alvo. Erro → tag i18n. Espelha `useAddAccount`.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'

export type CloseAccountTarget = Readonly<{ id: string; alias: string }>

export type CloseAccountBinding = Readonly<{
  /** Conta aguardando confirmação (modal aberto) — null quando fechado. */
  target: CloseAccountTarget | null
  closing: boolean
  errorTag: string | null
  request: (id: string, alias: string) => void
  cancel: () => void
  confirm: () => void
}>

export function useCloseAccount(): CloseAccountBinding {
  const qc = useQueryClient()
  const [target, setTarget] = useState<CloseAccountTarget | null>(null)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (id: string) => reconciliationRepository.closeAccount(id),
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
    closing: mut.isPending,
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
