/**
 * Binding "Nova transação" (lançamento manual, US4) — ADAPTER React. Classifica uma movimentação sem
 * título (Pagamento/Recebimento/Transferência/Tarifa-Multa-Juros/Aplicação/Resgate). Transferência/
 * Aplicação/Resgate exigem conta de destino + confirmação consciente (gating pela regra PURA
 * `requiresDestination`). Submete via `createManualEntry` e invalida as queries. Erros → tag i18n.
 *
 * Campos REAIS ligados (o manual-entry aceita): Fornecedor (`supplierRef`, via `listAllPartnersFn`) e
 * Programa (`programRef`, via `listProgramsFn`) — cross-módulo só via public-api (§I). Categoria/Centro de
 * custo seguem chrome (sem fonte: core-api#200/#147); Destino segue chrome (transferência: core-api#143).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import {
  requiresDestination,
  type ManualEntryType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'

// Opção de dropdown real (Fornecedor/Programa) — `value` = ref (UUID) enviado ao manual-entry.
export type ManualEntryOption = Readonly<{ value: string; label: string }>

export type ManualEntryBinding = Readonly<{
  type: ManualEntryType | null
  description: string
  destinationAccount: string
  consciousConfirm: boolean
  needsDestination: boolean
  showPayeeBlock: boolean
  canSubmit: boolean
  submitting: boolean
  errorTag: string | null
  supplierRef: string
  programRef: string
  partnerOptions: readonly ManualEntryOption[]
  programOptions: readonly ManualEntryOption[]
  setType: (type: ManualEntryType) => void
  setDescription: (v: string) => void
  setDestinationAccount: (v: string) => void
  setConsciousConfirm: (v: boolean) => void
  setSupplierRef: (v: string) => void
  setProgramRef: (v: string) => void
  reset: () => void
  submit: () => void
}>

// Fornecedores/parceiros ativos (agregador cross-módulo) → opções "Nome · documento". Erro/loading → [].
const partnerOptionsQuery = {
  queryKey: ['financial', 'recon', 'manual-partner-options'] as const,
  queryFn: async (): Promise<readonly ManualEntryOption[]> => {
    const r = await listAllPartnersFn()
    if (!r.ok) return []
    return r.data
      .filter((p) => p.active)
      .map((p) => ({ value: p.id, label: p.document === '' ? p.name : `${p.name} · ${p.document}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  },
  staleTime: 60_000,
}

// Programas ATIVOS (cross-módulo via public-api) → opções "SIGLA — Nome". Pagina (25/página). Erro → [].
const programOptionsQuery = {
  queryKey: ['financial', 'recon', 'manual-program-options'] as const,
  queryFn: async (): Promise<readonly ManualEntryOption[]> => {
    const out: ManualEntryOption[] = []
    let page = 1
    for (;;) {
      const r = await listProgramsFn({ data: { status: 'ATIVO', order: 'ASC', page, limit: 25 } })
      if (!r.ok) break
      for (const p of r.data.items) {
        out.push({ value: p.id, label: p.sigla === '' ? p.name : `${p.sigla} — ${p.name}` })
      }
      const { total, limit } = r.data.meta
      if (r.data.items.length === 0 || page * limit >= total) break
      page += 1
    }
    return out
  },
  staleTime: 60_000,
}

export function useManualEntry(
  selectedTx: StatementTransaction | null,
  onReconciled: (transactionId: string, reconciliationId: string) => void,
): ManualEntryBinding {
  const qc = useQueryClient()
  const [type, setType] = useState<ManualEntryType | null>(null)
  const [description, setDescription] = useState('')
  const [destinationAccount, setDestinationAccount] = useState('')
  const [consciousConfirm, setConsciousConfirm] = useState(false)
  const [supplierRef, setSupplierRef] = useState('')
  const [programRef, setProgramRef] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const partnerOptions = useQuery(partnerOptionsQuery).data ?? []
  const programOptions = useQuery(programOptionsQuery).data ?? []

  const needsDestination = type !== null && requiresDestination(type)
  const showPayeeBlock = type === 'Payment' || type === 'Receipt'
  // Destino/produto é chrome (depende de #168/lista de produtos); o gating consciente fica no checkbox.
  const destinationOk = !needsDestination || consciousConfirm
  const canSubmit = type !== null && destinationOk

  const mut = useMutation({
    mutationFn: (v: {
      transactionId: string
      type: ManualEntryType
      description?: string
      destinationAccount?: string
      supplierRef?: string
      programRef?: string
    }) => reconciliationRepository.createManualEntry(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setType(null)
        setDescription('')
        setDestinationAccount('')
        setConsciousConfirm(false)
        setSupplierRef('')
        setProgramRef('')
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
    showPayeeBlock,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    supplierRef,
    programRef,
    partnerOptions,
    programOptions,
    setType: (tp) => {
      setType(tp)
      setConsciousConfirm(false)
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
    setSupplierRef: (v) => {
      setSupplierRef(v)
    },
    setProgramRef: (v) => {
      setProgramRef(v)
    },
    reset: () => {
      setType(null)
      setDescription('')
      setDestinationAccount('')
      setConsciousConfirm(false)
      setSupplierRef('')
      setProgramRef('')
      setErrorTag(null)
    },
    submit: () => {
      if (selectedTx === null || type === null || !canSubmit) return
      mut.mutate({
        transactionId: selectedTx.id,
        type,
        description: description.trim() === '' ? undefined : description.trim(),
        destinationAccount: needsDestination ? destinationAccount.trim() : undefined,
        supplierRef: supplierRef === '' ? undefined : supplierRef,
        programRef: programRef === '' ? undefined : programRef,
      })
    },
  }
}
