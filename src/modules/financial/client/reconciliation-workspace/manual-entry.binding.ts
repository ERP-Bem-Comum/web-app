/**
 * Binding "Nova transação" (lançamento manual, US4) — ADAPTER React. Classifica uma movimentação sem
 * título (Pagamento/Recebimento/Transferência/Tarifa-Multa-Juros/Aplicação/Resgate). Transferência/
 * Aplicação/Resgate exigem conta de destino + confirmação consciente (gating pela regra PURA
 * `requiresDestination`). Submete via `createManualEntry` e invalida as queries. Erros → tag i18n.
 *
 * Campos REAIS ligados (o manual-entry aceita): Fornecedor (`supplierRef`), Programa (`programRef`), Plano
 * Orçamentário + a cascata Centro → Categoria → Subcategoria. #502/S2: o título manual carrega a taxonomia
 * PLANEJÁVEL — com um Plano selecionado, os 3 níveis vêm da ÁRVORE daquele plano (ADR-0051, espelho da
 * Fatia 1 do Lançar Documento); sem plano, do catálogo operacional. Cross-módulo só via public-api (§I).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import { maskMoneyBRL } from '#modules/financial/client/data/money.ts'
import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'
import { useTaxonomyCascade } from './taxonomy-cascade.binding.ts'
import {
  requiresDestination,
  manualEntryBlockedTag,
  formatDateBR,
  parseBRLToCents,
  type ManualEntryType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'
import type {
  DocumentType,
  ManualEntryTemplate,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

// #370: DocumentType do sistema p/ o dropdown "Tipo de doc" (só Pagamento/Recebimento). Espelha o enum do
// core-api; o rótulo é o próprio literal (já legível: "NFS-e", "DANFE"…).
const DOCUMENT_TYPES = ['NFS-e', 'DANFE', 'RPA', 'Fatura', 'Boleto', 'Recibo', 'Imposto'] as const
const isDocumentType = (v: string): v is DocumentType => (DOCUMENT_TYPES as readonly string[]).includes(v)
const DOCUMENT_TYPE_OPTIONS: readonly ManualEntryOption[] = DOCUMENT_TYPES.map((t) => ({
  value: t,
  label: t,
}))

// Opção de dropdown real (Fornecedor/Programa/Plano) — `value` = ref (UUID) enviado ao manual-entry.
export type ManualEntryOption = Readonly<{ value: string; label: string }>

export type ManualEntryBinding = Readonly<{
  type: ManualEntryType | null
  description: string
  destinationAccount: string
  needsDestination: boolean
  showPayeeBlock: boolean
  // Data de efetivação = data da transação bancária selecionada (o backend não aceita data no manual-entry;
  // usa a da transação). Só reflete (read-only) — DD/MM/AAAA. '' quando sem transação selecionada.
  effectiveDate: string
  // Transferência/Aplicação/Resgate circulam entre contas da PRÓPRIA empresa → sem categorização (centro/
  // categoria/subcategoria não se aplicam). `false` p/ esses 3; `true` p/ Pagamento/Recebimento/Tarifa-Juros.
  showCategorization: boolean
  canSubmit: boolean
  /** Tag i18n do motivo do bloqueio; `null` quando `canSubmit` — os dois saem da MESMA derivação. */
  submitBlockedTag: string | null
  submitting: boolean
  errorTag: string | null
  supplierRef: string
  budgetPlanRef: string
  programRef: string
  categoryRef: string
  subcategoryRef: string
  costCenterRef: string
  // #370: campos de documento (só no bloco Pagamento/Recebimento). `documentType` '' = sem seleção;
  // `issueDate` em YYYY-MM-DD (input nativo de data); `documentValue` = texto R$ digitado (parse na submit).
  documentNumber: string
  documentType: DocumentType | ''
  issueDate: string
  documentValue: string
  partnerOptions: readonly ManualEntryOption[]
  programOptions: readonly ManualEntryOption[]
  planoOptions: readonly ManualEntryOption[]
  categoryOptions: readonly ManualEntryOption[]
  subcategoryOptions: readonly ManualEntryOption[]
  costCenterOptions: readonly ManualEntryOption[]
  // #143: contas-cedente ATIVAS (exceto a própria origem) p/ Transferência/Aplicação/Resgate entre contas.
  accountOptions: readonly ManualEntryOption[]
  // #370: opções do "Tipo de doc" (DocumentType do sistema).
  documentTypeOptions: readonly ManualEntryOption[]
  setType: (type: ManualEntryType) => void
  setDescription: (v: string) => void
  setDestinationAccount: (v: string) => void
  setSupplierRef: (v: string) => void
  setBudgetPlanRef: (v: string) => void
  setProgramRef: (v: string) => void
  setCategoryRef: (v: string) => void
  setSubcategoryRef: (v: string) => void
  setCostCenterRef: (v: string) => void
  setDocumentNumber: (v: string) => void
  setDocumentType: (v: string) => void
  setIssueDate: (v: string) => void
  setDocumentValue: (v: string) => void
  reset: () => void
  submit: () => void
}>

// Fornecedores/parceiros ativos (agregador cross-módulo) → opções "Nome · documento". Erro/loading → [].
const partnerOptionsQuery = {
  queryKey: ['financial', 'recon', 'manual-partner-options'] as const,
  queryFn: async (): Promise<readonly ManualEntryOption[]> => {
    const r = await listAllPartnersFn()
    if (!r.ok) return []
    return (
      r.data
        .filter((p) => p.active)
        // Só o NOME na Conciliação (pedido da P.O.) — o "nome · documento" do #190 é do dropdown compartilhado
        // do Lançar Documento/Novo Contrato; aqui a lista é montada localmente, então não afeta aquele.
        .map((p) => ({ value: p.id, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    )
  },
  staleTime: 60_000,
}

// #502/S2: a cascata dos 5 níveis (queries + opções + resets) vive em `taxonomy-cascade.binding.ts`,
// compartilhada com o "Editar" da M2 (specs/110). Aqui só ligamos o estado dela ao formulário.

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
  const cascade = useTaxonomyCascade()
  // #370: campos de documento (Pagamento/Recebimento). `documentType` '' = sem seleção.
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [issueDate, setIssueDate] = useState('')
  const [documentValue, setDocumentValue] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const partnerOptions = useQuery(partnerOptionsQuery).data ?? []
  const programOptions = cascade.programOptions
  const planoOptions = cascade.planoOptions
  // A cascata (opções + resets) vem do hook compartilhado; aqui só damos nomes locais aos 5 refs.
  const { programRef, budgetPlanRef, costCenterRef, categoryRef, subcategoryRef } = cascade.refs
  const costCenterOptions = cascade.costCenterOptions
  const categoryOptions = cascade.categoryOptions
  const subcategoryOptions = cascade.subcategoryOptions
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
  // Data de efetivação reflete a data da transação selecionada (read-only). Categorização não se aplica aos
  // 3 tipos entre contas próprias (Transfer/Investment/Redemption = requiresDestination).
  const effectiveDate = selectedTx !== null ? formatDateBR(selectedTx.date) : ''
  const showCategorization = type !== null && !requiresDestination(type)
  // Transferência/Aplicação/Resgate exigem a conta de destino selecionada (regra do backend). A confirmação
  // consciente foi removida a pedido da P.O. — só atrapalhava; engano é reversível pelo "desfazer".
  // Regra da P.O. (Opção 1): tipo classificável (não-realocação → showCategorization) exige categoria +
  // centro de custo ao conciliar. O backend é a autoridade (422 manual-entry-classification-required);
  // aqui é a UX que trava o envio antes de bater na borda. Isentos: Transfer/Investment/Redemption.
  //
  // O motivo vem da derivação PURA e o `canSubmit` é consequência dele — nunca o contrário. Ver
  // `manualEntryBlockedTag`: o botão não pode travar sem ter o que dizer.
  const submitBlockedTag = manualEntryBlockedTag({
    hasType: type !== null,
    needsDestination,
    destinationFilled: destinationAccount.trim() !== '',
    needsClassification: showCategorization,
    categoryFilled: categoryRef.trim() !== '',
    costCenterFilled: costCenterRef.trim() !== '',
  })
  const canSubmit = submitBlockedTag === null

  const mut = useMutation({
    mutationFn: (v: {
      transactionId: string
      type: ManualEntryType
      description?: string
      destinationAccount?: string
      productLabel?: string
      supplierRef?: string
      budgetPlanRef?: string
      programRef?: string
      categoryRef?: string
      subcategoryRef?: string
      costCenterRef?: string
      documentNumber?: string
      documentType?: DocumentType
      issueDate?: string
      documentValueCents?: string
    }) => reconciliationRepository.createManualEntry(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setType(null)
        setDescription('')
        setDestinationAccount('')
        setSupplierRef('')
        cascade.reset()
        setDocumentNumber('')
        setDocumentType('')
        setIssueDate('')
        setDocumentValue('')
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
          ...(v.budgetPlanRef !== undefined ? { budgetPlanRef: v.budgetPlanRef } : {}),
          ...(v.categoryRef !== undefined ? { categoryRef: v.categoryRef } : {}),
          ...(v.subcategoryRef !== undefined ? { subcategoryRef: v.subcategoryRef } : {}),
          ...(v.costCenterRef !== undefined ? { costCenterRef: v.costCenterRef } : {}),
          ...(v.programRef !== undefined ? { programRef: v.programRef } : {}),
          ...(v.description !== undefined ? { description: v.description } : {}),
          // #370: os campos de documento entram no template p/ o reuso na sugestão em lote (só payee block).
          ...(v.documentNumber !== undefined ? { documentNumber: v.documentNumber } : {}),
          ...(v.documentType !== undefined ? { documentType: v.documentType } : {}),
          ...(v.issueDate !== undefined ? { issueDate: v.issueDate } : {}),
          ...(v.documentValueCents !== undefined ? { documentValueCents: v.documentValueCents } : {}),
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
    effectiveDate,
    showCategorization,
    canSubmit,
    submitBlockedTag,
    submitting: mut.isPending,
    errorTag,
    supplierRef,
    budgetPlanRef,
    programRef,
    categoryRef,
    subcategoryRef,
    costCenterRef,
    documentNumber,
    documentType,
    issueDate,
    documentValue,
    partnerOptions,
    programOptions,
    planoOptions,
    categoryOptions,
    subcategoryOptions,
    costCenterOptions,
    accountOptions,
    documentTypeOptions: DOCUMENT_TYPE_OPTIONS,
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
    // Cascata pelo hook compartilhado: trocar um nível zera os inferiores (RN-M2-08), e reescolher o MESMO
    // valor NÃO zera nada — a guarda de no-op que faltava aqui (mesma classe do bug da specs/109).
    setBudgetPlanRef: (v) => {
      cascade.setLevel('budgetPlanRef', v)
    },
    setProgramRef: (v) => {
      cascade.setLevel('programRef', v)
    },
    setCategoryRef: (v) => {
      cascade.setLevel('categoryRef', v)
    },
    setSubcategoryRef: (v) => {
      cascade.setLevel('subcategoryRef', v)
    },
    setCostCenterRef: (v) => {
      cascade.setLevel('costCenterRef', v)
    },
    setDocumentNumber: (v) => {
      setDocumentNumber(v)
    },
    setDocumentType: (v) => {
      // O select só oferece valores da lista canônica; '' = placeholder. Guarda evita valor fora do enum.
      setDocumentType(isDocumentType(v) ? v : '')
    },
    setIssueDate: (v) => {
      setIssueDate(v)
    },
    setDocumentValue: (v) => {
      // Máscara de moeda BRL "as-you-type" (o MESMO helper do "Lançar Documento"/grossValue): mostra
      // "133.830,10"; a submit converte p/ centavos via parseBRLToCents. Vazio → '' (omite no envio).
      setDocumentValue(maskMoneyBRL(v))
    },
    reset: () => {
      setType(null)
      setDescription('')
      setDestinationAccount('')
      setSupplierRef('')
      cascade.reset()
      setDocumentNumber('')
      setDocumentType('')
      setIssueDate('')
      setDocumentValue('')
      setErrorTag(null)
    },
    submit: () => {
      if (selectedTx === null || type === null || !canSubmit) return
      // Aplicação/Resgate: o backend exige um "produto" (texto). Como modelamos entre contas, mandamos o
      // nome da conta de destino como `productLabel` (satisfaz a regra) + o `destinationAccount` real.
      const isProductRealloc = type === 'Investment' || type === 'Redemption'
      const destLabel = accountOptions.find((o) => o.value === destinationAccount.trim())?.label
      // #502/S2: categoria e subcategoria SEPARADAS (não dobra mais a folha em categoryRef) — coerente com o
      // documento (S1). Categorização não se aplica aos 3 tipos entre contas próprias → não envia nada.
      const plan = showCategorization && budgetPlanRef !== '' ? budgetPlanRef : undefined
      const cat = showCategorization && categoryRef !== '' ? categoryRef : undefined
      const sub = showCategorization && subcategoryRef !== '' ? subcategoryRef : undefined
      const costCenter = showCategorization && costCenterRef !== '' ? costCenterRef : undefined
      // #370: campos de documento SÓ no bloco Pagamento/Recebimento (showPayeeBlock). `documentValueCents`
      // omitido quando vazio/ilegível → o backend usa o valor da transação conciliada. `issueDate` já vem
      // YYYY-MM-DD (input nativo de data); `documentValue` é texto R$ → centavos via parseBRLToCents.
      const docNumber = showPayeeBlock && documentNumber.trim() !== '' ? documentNumber.trim() : undefined
      const docType = showPayeeBlock && documentType !== '' ? documentType : undefined
      const docIssueDate = showPayeeBlock && issueDate !== '' ? issueDate : undefined
      const docValueCents = showPayeeBlock ? parseBRLToCents(documentValue) : null
      mut.mutate({
        transactionId: selectedTx.id,
        type,
        description: description.trim() === '' ? undefined : description.trim(),
        destinationAccount:
          needsDestination && destinationAccount.trim() !== '' ? destinationAccount.trim() : undefined,
        productLabel: isProductRealloc && destLabel !== undefined ? destLabel.slice(0, 120) : undefined,
        supplierRef: supplierRef === '' ? undefined : supplierRef,
        budgetPlanRef: plan,
        programRef: programRef === '' ? undefined : programRef,
        categoryRef: cat,
        subcategoryRef: sub,
        costCenterRef: costCenter,
        documentNumber: docNumber,
        documentType: docType,
        issueDate: docIssueDate,
        documentValueCents: docValueCents !== null ? String(docValueCents) : undefined,
      })
    },
  }
}
