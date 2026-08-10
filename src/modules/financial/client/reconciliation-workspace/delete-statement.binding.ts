/**
 * Binding "Excluir extrato" (core-api#558) — ADAPTER React. Apaga o extrato bancário importado (hard-delete:
 * as transações não conciliadas somem por cascade). Confirmação em modal (destrutivo) antes de disparar. No
 * SUCESSO: limpa o statement da sessão (via `onDeleted`) e invalida o namespace `['financial','reconciliation']`.
 * Erros → tag i18n de EXCLUSÃO (`deleteStatementErrorTag`): guardas 409 viram mensagens acionáveis.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { deleteStatementErrorTag } from './reconciliation-workspace.view-model.ts'

export type DeleteStatementBinding = Readonly<{
  /** Só há o que excluir quando um extrato está carregado na sessão. */
  canDelete: boolean
  deleting: boolean
  errorTag: string | null
  /** Modal de confirmação aberto. */
  confirmOpen: boolean
  /** Abre o modal de confirmação (não exclui ainda). */
  requestDelete: () => void
  /** Confirma no modal → dispara a exclusão. */
  confirmDelete: () => void
  /** Fecha o modal sem excluir (limpa o erro). */
  cancelDelete: () => void
}>

export function useDeleteStatement(
  statementId: string | null,
  // Chamado no sucesso: limpa o statement da UI + remove o localStorage (dono do estado = workspace binding).
  onDeleted: () => void,
): DeleteStatementBinding {
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: (id: string) => reconciliationRepository.deleteBankStatement(id),
    onSuccess: (res) => {
      if (res.ok) {
        setErrorTag(null)
        setConfirmOpen(false)
        onDeleted()
        // Exclusão remove o extrato + transações → invalida todo o namespace (lista, extrato, contadores, saldos).
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
      } else {
        setErrorTag(deleteStatementErrorTag(res.error))
      }
    },
  })

  const canDelete = statementId !== null && !mut.isPending

  return {
    canDelete,
    deleting: mut.isPending,
    errorTag,
    confirmOpen,
    requestDelete: () => {
      if (statementId === null) return
      setErrorTag(null)
      setConfirmOpen(true)
    },
    confirmDelete: () => {
      if (statementId === null) return
      mut.mutate(statementId)
    },
    cancelDelete: () => {
      setConfirmOpen(false)
      setErrorTag(null)
    },
  }
}
