/**
 * Binding "Nova transação" (lançamento manual, US4) — ADAPTER React. Classifica uma movimentação sem
 * título (Pagamento/Recebimento/Transferência/Tarifa-Multa-Juros/Aplicação/Resgate). Transferência/
 * Aplicação/Resgate exigem conta de destino + confirmação consciente (gating pela regra PURA
 * `requiresDestination`). Submete via `createManualEntry` e invalida as queries. Erros → tag i18n.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import {
  requiresDestination,
  type ManualEntryType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'

export type ManualEntryBinding = Readonly<{
  type: ManualEntryType | null
  description: string
  destinationAccount: string
  consciousConfirm: boolean
  needsDestination: boolean
  canSubmit: boolean
  submitting: boolean
  errorTag: string | null
  setType: (type: ManualEntryType) => void
  setDescription: (v: string) => void
  setDestinationAccount: (v: string) => void
  setConsciousConfirm: (v: boolean) => void
  submit: () => void
}>

export function useManualEntry(
  selectedTx: StatementTransaction | null,
  onReconciled: (transactionId: string, reconciliationId: string) => void,
): ManualEntryBinding {
  const qc = useQueryClient()
  const [type, setType] = useState<ManualEntryType | null>(null)
  const [description, setDescription] = useState('')
  const [destinationAccount, setDestinationAccount] = useState('')
  const [consciousConfirm, setConsciousConfirm] = useState(false)
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const needsDestination = type !== null && requiresDestination(type)
  const destinationOk = !needsDestination || (destinationAccount.trim() !== '' && consciousConfirm)
  const canSubmit = type !== null && destinationOk

  const mut = useMutation({
    mutationFn: (v: {
      transactionId: string
      type: ManualEntryType
      description?: string
      destinationAccount?: string
    }) => reconciliationRepository.createManualEntry(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setType(null)
        setDescription('')
        setDestinationAccount('')
        setConsciousConfirm(false)
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation', 'transactions'] })
        onReconciled(v.transactionId, res.value.reconciliationId)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    type,
    description,
    destinationAccount,
    consciousConfirm,
    needsDestination,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    setType: (tp) => {
      setType(tp)
    },
    setDescription: (v) => {
      setDescription(v)
    },
    setDestinationAccount: (v) => {
      setDestinationAccount(v)
    },
    setConsciousConfirm: (v) => {
      setConsciousConfirm(v)
    },
    submit: () => {
      if (selectedTx === null || type === null || !canSubmit) return
      mut.mutate({
        transactionId: selectedTx.id,
        type,
        description: description.trim() === '' ? undefined : description.trim(),
        destinationAccount: needsDestination ? destinationAccount.trim() : undefined,
      })
    },
  }
}
