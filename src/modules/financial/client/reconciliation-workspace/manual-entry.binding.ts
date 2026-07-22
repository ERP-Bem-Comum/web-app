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
import { listAllPartnersFn } from '#modules/partners/public-api/index.ts'
import { listProgramsFn } from '#modules/programs/public-api/index.ts'
import {
  listBudgetPlansFn,
  getBudgetPlanDetailFn,
  type PlanDetail,
} from '#modules/budget-plans/public-api/index.ts'
import {
  planCostCenterOptions,
  planCategoryOptions,
  planSubcategoryOptions,
} from '#modules/financial/client/data/helpers/plan-taxonomy-cascade.ts'
import { referencesQueryOptions } from './reconciliation-workspace.query.ts'
import {
  relabelReconCategory,
  requiresDestination,
  formatDateBR,
  categoriesForCostCenter,
  subcategoriesOf,
  type ManualEntryType,
  type StatementTransaction,
} from './reconciliation-workspace.view-model.ts'
import type { ManualEntryTemplate } from '#modules/financial/client/data/model/reconciliation.model.ts'

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
  submitting: boolean
  errorTag: string | null
  supplierRef: string
  budgetPlanRef: string
  programRef: string
  categoryRef: string
  subcategoryRef: string
  costCenterRef: string
  partnerOptions: readonly ManualEntryOption[]
  programOptions: readonly ManualEntryOption[]
  planoOptions: readonly ManualEntryOption[]
  categoryOptions: readonly ManualEntryOption[]
  subcategoryOptions: readonly ManualEntryOption[]
  costCenterOptions: readonly ManualEntryOption[]
  // #143: contas-cedente ATIVAS (exceto a própria origem) p/ Transferência/Aplicação/Resgate entre contas.
  accountOptions: readonly ManualEntryOption[]
  setType: (type: ManualEntryType) => void
  setDescription: (v: string) => void
  setDestinationAccount: (v: string) => void
  setSupplierRef: (v: string) => void
  setBudgetPlanRef: (v: string) => void
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

// #502/S2: planos APROVADOS p/ o dropdown (mesma regra do Lançar Documento — só aprovados + cenário no
// rótulo, p/ não pegar um rascunho homônimo por engano). Cross-módulo via public-api. Erro/sem permissão → [].
const planoOptionsQuery = {
  queryKey: ['budget-plans', 'options', 'recon-manual'] as const,
  queryFn: async (): Promise<readonly ManualEntryOption[]> => {
    const r = await listBudgetPlansFn({ data: { page: 1, limit: 100 } })
    if (!r.ok) return []
    return r.data.items
      .filter((p) => p.status === 'APROVADO')
      .map((p) => ({
        value: p.id,
        label:
          `${String(p.year)} ${p.programAbbreviation ?? p.programName} ${p.version.toFixed(1)}` +
          (p.scenarioName !== null ? ` · ${p.scenarioName}` : ''),
      }))
  },
  staleTime: 60_000,
}

// O `budgetPlanRef` só vira fonte da cascata quando é um UUID de verdade (dropdown escolhido); vazio → cai no
// operacional (nunca esvazia). Mesma blindagem do Lançar Documento (Fatia 1).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isPlanId = (v: string): boolean => UUID_RE.test(v)

/** Árvore do plano — só habilita com UUID válido (sem plano → não busca, cai no operacional). */
const planDetailQuery = (planoRef: string) => ({
  queryKey: ['budget-plans', 'detail', 'categorization', planoRef] as const,
  queryFn: async (): Promise<PlanDetail | null> => {
    const r = await getBudgetPlanDetailFn({ data: { id: planoRef } })
    return r.ok ? r.data : null
  },
  enabled: isPlanId(planoRef),
  staleTime: 300_000,
})

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
  const [budgetPlanRef, setBudgetPlanRef] = useState('')
  const [programRef, setProgramRef] = useState('')
  const [categoryRef, setCategoryRef] = useState('')
  const [subcategoryRef, setSubcategoryRef] = useState('')
  const [costCenterRef, setCostCenterRef] = useState('')
  const [errorTag, setErrorTag] = useState<string | null>(null)

  const partnerOptions = useQuery(partnerOptionsQuery).data ?? []
  const programOptions = useQuery(programOptionsQuery).data ?? []
  const planoOptions = useQuery(planoOptionsQuery).data ?? []
  // Referências da categorização (020 · #200): a query devolve um Result → desembrulha p/ as opções.
  const referencesResult = useQuery(referencesQueryOptions()).data
  const references = referencesResult?.ok === true ? referencesResult.value : null
  // Árvore do plano selecionado (Fatia 1): com plano válido, a cascata vem DELA; senão, do operacional.
  const usePlan = isPlanId(budgetPlanRef)
  const planDetail = useQuery(planDetailQuery(budgetPlanRef)).data ?? null
  // Cascata Centro → Categoria → Subcategoria. Com plano (ADR-0051): árvore do plano (só nós ativos, value =
  // ref). Sem plano: catálogo operacional — Categoria filtra pelo centro (#341), Subcategoria pela categoria
  // via `parentId`, com o relabel de conciliação. Enquanto a árvore do plano carrega → [] (não vaza o operacional).
  const costCenterOptions: readonly ManualEntryOption[] = usePlan
    ? planDetail === null
      ? []
      : planCostCenterOptions(planDetail)
    : (references?.costCenters.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })) ?? [])
  const categoryOptions: readonly ManualEntryOption[] = usePlan
    ? planDetail === null
      ? []
      : planCategoryOptions(planDetail, costCenterRef)
    : references !== null
      ? categoriesForCostCenter(references, costCenterRef).map((c) => ({
          value: c.id,
          label: relabelReconCategory(c.name),
        }))
      : []
  const subcategoryOptions: readonly ManualEntryOption[] = usePlan
    ? planDetail === null
      ? []
      : planSubcategoryOptions(planDetail, categoryRef)
    : references !== null
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
  // Data de efetivação reflete a data da transação selecionada (read-only). Categorização não se aplica aos
  // 3 tipos entre contas próprias (Transfer/Investment/Redemption = requiresDestination).
  const effectiveDate = selectedTx !== null ? formatDateBR(selectedTx.date) : ''
  const showCategorization = type !== null && !requiresDestination(type)
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
      budgetPlanRef?: string
      programRef?: string
      categoryRef?: string
      subcategoryRef?: string
      costCenterRef?: string
    }) => reconciliationRepository.createManualEntry(v),
    onSuccess: (res, v) => {
      if (res.ok) {
        setErrorTag(null)
        setType(null)
        setDescription('')
        setDestinationAccount('')
        setSupplierRef('')
        setBudgetPlanRef('')
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
          ...(v.budgetPlanRef !== undefined ? { budgetPlanRef: v.budgetPlanRef } : {}),
          ...(v.categoryRef !== undefined ? { categoryRef: v.categoryRef } : {}),
          ...(v.subcategoryRef !== undefined ? { subcategoryRef: v.subcategoryRef } : {}),
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
    effectiveDate,
    showCategorization,
    canSubmit,
    submitting: mut.isPending,
    errorTag,
    supplierRef,
    budgetPlanRef,
    programRef,
    categoryRef,
    subcategoryRef,
    costCenterRef,
    partnerOptions,
    programOptions,
    planoOptions,
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
    setBudgetPlanRef: (v) => {
      setBudgetPlanRef(v)
      // Trocar o plano troca a ÁRVORE da cascata (ADR-0051) → zera centro/categoria/subcategoria, senão a
      // folha gravada seria órfã (§IV). Mesma regra do Lançar Documento.
      setCostCenterRef('')
      setCategoryRef('')
      setSubcategoryRef('')
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
      setBudgetPlanRef('')
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
      // #502/S2: categoria e subcategoria SEPARADAS (não dobra mais a folha em categoryRef) — coerente com o
      // documento (S1). Categorização não se aplica aos 3 tipos entre contas próprias → não envia nada.
      const plan = showCategorization && isPlanId(budgetPlanRef) ? budgetPlanRef : undefined
      const cat = showCategorization && categoryRef !== '' ? categoryRef : undefined
      const sub = showCategorization && subcategoryRef !== '' ? subcategoryRef : undefined
      const costCenter = showCategorization && costCenterRef !== '' ? costCenterRef : undefined
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
      })
    },
  }
}
