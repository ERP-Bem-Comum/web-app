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
import { referencesQueryOptions } from './reconciliation-workspace.query.ts'
import {
  relabelReconCategory,
  requiresDestination,
  categoriesForCostCenter,
  subcategoriesOf,
  type ManualEntryType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'
import type { ManualEntryTemplate } from '#modules/financial/client/data/model/reconciliation.model.ts'

// Opção de dropdown real (Fornecedor/Programa) — `value` = ref (UUID) enviado ao manual-entry.
export type ManualEntryOption = Readonly<{ value: string; label: string }>

export type ManualEntryBinding = Readonly<{
  type: ManualEntryType | null
  description: string
  destinationAccount: string
  needsDestination: boolean
  showPayeeBlock: boolean
  canSubmit: boolean
  submitting: boolean
  errorTag: string | null
  supplierRef: string
  programRef: string
  categoryRef: string
  subcategoryRef: string
  costCenterRef: string
  partnerOptions: readonly ManualEntryOption[]
  programOptions: readonly ManualEntryOption[]
  categoryOptions: readonly ManualEntryOption[]
  subcategoryOptions: readonly ManualEntryOption[]
  costCenterOptions: readonly ManualEntryOption[]
  // #143: contas-cedente ATIVAS (exceto a própria origem) p/ Transferência/Aplicação/Resgate entre contas.
  accountOptions: readonly ManualEntryOption[]
  setType: (type: ManualEntryType) => void
  setDescription: (v: string) => void
  setDestinationAccount: (v: string) => void
  setSupplierRef: (v: string) => void
  setProgramRef: (v: string) => void
  setCategoryRef: (v: string) => void
  setSubcategoryRef: (v: string) => void
  setCostCenterRef: (v: string) => void
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
  accountRef: string,
  selectedTx: StatementTransaction | null,
  onReconciled: (
    transactionId: string,
    reconciliationId: string,
    manualType?: ManualEntryType,
    counterparty?: string,
    template?: ManualEntryTemplate,
  ) => void,
): ManualEntryBinding {
  const qc = useQueryClient()
  const [type, setType] = useState<ManualEntryType | null>(null)
  const [description, setDescription] = useState('')
  const [destinationAccount, setDestinationAccount] = useState('')
  const [supplierRef, setSupplierRef] = useState('')
  const [programRef, setProgramRef] = useState('')
  const [categoryRef, setCategoryRef] = useState('')
  const [subcategoryRef, setSubcategoryRef] = useState('')
  const [costCenterRef, setCostCenterRef] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const partnerOptions = useQuery(partnerOptionsQuery).data ?? []
  const programOptions = useQuery(programOptionsQuery).data ?? []
  // Referências da categorização (020 · #200): a query devolve um Result → desembrulha p/ as opções.
  const referencesResult = useQuery(referencesQueryOptions()).data
  const references = referencesResult?.ok === true ? referencesResult.value : null
  // Cascata Centro → Categoria → Subcategoria (EPIC #150). Categoria filtra pelo centro (placeholder
  // #341 até o backend ligar categoria→centro); Subcategoria filtra pela categoria via `parentId` (real).
  const costCenterOptions: readonly ManualEntryOption[] =
    references?.costCenters.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })) ?? []
  const categoryOptions: readonly ManualEntryOption[] =
    references !== null
      ? categoriesForCostCenter(references, costCenterRef).map((c) => ({
          value: c.id,
          label: relabelReconCategory(c.name),
        }))
      : []
  const subcategoryOptions: readonly ManualEntryOption[] =
    references !== null
      ? subcategoriesOf(references, categoryRef).map((c) => ({
          value: c.id,
          label: relabelReconCategory(c.name),
        }))
      : []
  // #143: contas-cedente ATIVAS p/ destino da transferência/aplicação/resgate — exclui a própria origem
  // (o backend rejeita destino == origem). Reusa `listAccounts` (#138), as MESMAS contas do grid.
  const accountOptions =
    useQuery({
      queryKey: ['financial', 'recon', 'manual-account-options'] as const,
      queryFn: async () => {
        const r = await reconciliationRepository.listAccounts()
        return r.ok ? r.value : []
      },
      staleTime: 60_000,
      select: (accounts): readonly ManualEntryOption[] =>
        accounts
          .filter((a) => a.status === 'Active' && a.id !== accountRef)
          .map((a) => ({
            value: a.id,
            label: `${a.alias} · ${a.bankName} · CC ${a.accountNumber}-${a.accountDv}`,
          })),
    }).data ?? []

  const needsDestination = type !== null && requiresDestination(type)
  const showPayeeBlock = type === 'Payment' || type === 'Receipt'
  // Transferência/Aplicação/Resgate exigem a conta de destino selecionada (regra do backend). A confirmação
  // consciente foi removida a pedido da P.O. — só atrapalhava; engano é reversível pelo "desfazer".
  const destinationOk = !needsDestination || destinationAccount.trim() !== ''
  const canSubmit = type !== null && destinationOk

  const mut = useMutation({
    mutationFn: (v: {
      transactionId: string
      type: ManualEntryType
      description?: string
      destinationAccount?: string
      productLabel?: string
      supplierRef?: string
      programRef?: string
      categoryRef?: string
      costCenterRef?: string
    }) => reconciliationRepository.createManualEntry(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setType(null)
        setDescription('')
        setDestinationAccount('')
        setSupplierRef('')
        setProgramRef('')
        setCategoryRef('')
        setSubcategoryRef('')
        setCostCenterRef('')
        // Baixa manual concilia a transação → invalida o namespace (lista do período + contadores).
        void qc.invalidateQueries({ queryKey: ['financial', 'reconciliation'] })
        // Contraparte p/ o detalhe (sessão): conta de destino (realocação) ou fornecedor (pagamento/recebimento).
        const counterparty =
          v.type === 'Transfer' || v.type === 'Investment' || v.type === 'Redemption'
            ? accountOptions.find((o) => o.value === v.destinationAccount)?.label
            : v.type === 'Payment' || v.type === 'Receipt'
              ? partnerOptions.find((o) => o.value === v.supplierRef)?.label
              : undefined
        // Template do padrão aplicado → reuso na sugestão de conciliação em lote (só campos sem destino).
        const template: ManualEntryTemplate = {
          type: v.type,
          ...(v.supplierRef !== undefined ? { supplierRef: v.supplierRef } : {}),
          ...(v.categoryRef !== undefined ? { categoryRef: v.categoryRef } : {}),
          ...(v.costCenterRef !== undefined ? { costCenterRef: v.costCenterRef } : {}),
          ...(v.programRef !== undefined ? { programRef: v.programRef } : {}),
          ...(v.description !== undefined ? { description: v.description } : {}),
        }
        onReconciled(v.transactionId, res.value.reconciliationId, v.type, counterparty, template)
      } else {
        setErrorTag(reconciliationErrorTag(res.error))
      }
    },
  })

  return {
    type,
    description,
    destinationAccount,
    needsDestination,
    showPayeeBlock,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    supplierRef,
    programRef,
    categoryRef,
    subcategoryRef,
    costCenterRef,
    partnerOptions,
    programOptions,
    categoryOptions,
    subcategoryOptions,
    costCenterOptions,
    accountOptions,
    setType: (tp) => {
      setType(tp)
    },
    setDescription: (v) => {
      setDescription(v)
    },
    setDestinationAccount: (v) => {
      setDestinationAccount(v)
    },
    setSupplierRef: (v) => {
      setSupplierRef(v)
    },
    setProgramRef: (v) => {
      setProgramRef(v)
    },
    setCategoryRef: (v) => {
      setCategoryRef(v)
      setSubcategoryRef('') // trocar a categoria zera a subcategoria (cascata)
    },
    setSubcategoryRef: (v) => {
      setSubcategoryRef(v)
    },
    setCostCenterRef: (v) => {
      setCostCenterRef(v)
      setCategoryRef('') // trocar o centro zera categoria + subcategoria (cascata)
      setSubcategoryRef('')
    },
    reset: () => {
      setType(null)
      setDescription('')
      setDestinationAccount('')
      setSupplierRef('')
      setProgramRef('')
      setCategoryRef('')
      setSubcategoryRef('')
      setCostCenterRef('')
      setErrorTag(null)
    },
    submit: () => {
      if (selectedTx === null || type === null || !canSubmit) return
      // Aplicação/Resgate: o backend exige um "produto" (texto). Como modelamos entre contas, mandamos o
      // nome da conta de destino como `productLabel` (satisfaz a regra) + o `destinationAccount` real.
      const isProductRealloc = type === 'Investment' || type === 'Redemption'
      const destLabel = accountOptions.find((o) => o.value === destinationAccount.trim())?.label
      // Envia a FOLHA da cascata como categoryRef: subcategoria (se escolhida) senão a categoria. Ambas são
      // categorias válidas p/ o backend (subcategoria = categoria com parentId). TODO #341: enviar refs separadas.
      const leafCategory = subcategoryRef !== '' ? subcategoryRef : categoryRef
      mut.mutate({
        transactionId: selectedTx.id,
        type,
        description: description.trim() === '' ? undefined : description.trim(),
        destinationAccount:
          needsDestination && destinationAccount.trim() !== '' ? destinationAccount.trim() : undefined,
        productLabel: isProductRealloc && destLabel !== undefined ? destLabel.slice(0, 120) : undefined,
        supplierRef: supplierRef === '' ? undefined : supplierRef,
        programRef: programRef === '' ? undefined : programRef,
        categoryRef: leafCategory === '' ? undefined : leafCategory,
        costCenterRef: costCenterRef === '' ? undefined : costCenterRef,
      })
    },
  }
}
