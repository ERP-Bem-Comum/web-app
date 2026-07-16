/**
 * Binding do modal "Centros de Custo" (§1.5) — ADAPTER React (§XI). UI-state (aberto, centro selecionado, modo
 * do painel, campos do form, nós desativados/recolhidos) + ESCRITA REAL da estrutura (feature 061 — Grupo B):
 * criar Centro → Categoria → Subcategoria via server-fn. Cada `onSuccess` invalida `planDetailQueryKey(id)` (a
 * árvore relê pronta do BFF §III), e o centro recém-criado é auto-selecionado (cascata: habilita criar sob ele).
 * Erros como valores (§V): `errorTag` (client-side `name-required` OU tag do backend). Editar/desativar seguem
 * front-first (o contrato do Grupo B só tem os 3 POSTs de criação).
 */
import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isErr } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.query-key.ts'
import {
  buildCentrosTree,
  emptyCentroFormFields,
  nodeKey,
  validateCentroName,
  CENTRO_TIPO_OPTIONS,
  SUB_TIPO_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  type CentroNode,
  type CentroFormMode,
  type CentroFormFields,
  type CentroFormError,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.view-model.ts'
import type {
  CostCenterType,
  SubCategoryType,
  ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

/** Tag de erro exibida no painel de formulário: validação client-side OU eco do backend (§V). */
export type CentrosCustoErrorTag = CentroFormError | BudgetPlansError

export type CentrosCustoBinding = Readonly<{
  open: boolean
  programName: string
  centros: readonly CentroNode[]
  selectedCentroId: number | null
  selectedCentro: CentroNode | null
  formMode: CentroFormMode
  form: CentroFormFields
  centroTipoOptions: readonly CostCenterType[]
  subTipoOptions: readonly SubCategoryType[]
  releaseTypeOptions: readonly ReleaseType[]
  /** Tag de erro da submissão (ou `null`). A view resolve o rótulo i18n. */
  errorTag: CentrosCustoErrorTag | null
  /** Submissão em curso (algum dos 3 POSTs pendente) — a view desabilita o botão de salvar. */
  submitting: boolean
  isDeactivated: (kind: 'centro' | 'categoria' | 'sub', id: number) => boolean
  isCollapsed: (kind: 'centro' | 'categoria', id: number) => boolean
  toggleCollapse: (kind: 'centro' | 'categoria', id: number) => void
  openModal: () => void
  close: () => void
  selectCentro: (id: number) => void
  startForm: (mode: CentroFormMode) => void
  cancelForm: () => void
  setNome: (v: string) => void
  setCentroTipo: (v: CostCenterType) => void
  setSubTipo: (v: SubCategoryType) => void
  setReleaseType: (v: ReleaseType) => void
  submitForm: () => void
  toggleDeactivate: (kind: 'centro' | 'categoria' | 'sub', id: number) => void
}>

export function useCentrosCusto(planId: string, detail: PlanDetail | null): CentrosCustoBinding {
  const queryClient = useQueryClient()

  const centros = useMemo<readonly CentroNode[]>(
    () => (detail !== null ? buildCentrosTree(detail) : []),
    [detail],
  )

  const [open, setOpen] = useState(false)
  const [selectedCentroId, setSelectedCentroId] = useState<number | null>(centros[0]?.id ?? null)
  const [formMode, setFormMode] = useState<CentroFormMode>({ kind: 'none' })
  const [form, setForm] = useState<CentroFormFields>(emptyCentroFormFields)
  const [deactivated, setDeactivated] = useState<ReadonlySet<string>>(new Set())
  // Nós recolhidos (chevron); por padrão tudo expandido → o Set guarda só os fechados.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [errorTag, setErrorTag] = useState<CentrosCustoErrorTag | null>(null)
  // Após criar um centro, guardamos o `ref` novo; a seleção derivada abaixo o prioriza quando a árvore relê
  // (cascata: o centro recém-criado fica selecionado sem effect — derivação pura §XI). `selectCentro` o limpa.
  const [pendingSelectRef, setPendingSelectRef] = useState<string | null>(null)

  // Seleção efetiva (derivada, sem setState-em-effect): o centro pendente (recém-criado) tem prioridade quando
  // já aparece na árvore; senão a seleção manual; senão o primeiro centro.
  const pendingCentro =
    pendingSelectRef !== null ? (centros.find((c) => c.ref === pendingSelectRef) ?? null) : null
  const selectedCentro = pendingCentro ?? centros.find((c) => c.id === selectedCentroId) ?? centros[0] ?? null

  const invalidateDetail = (): void => {
    void queryClient.invalidateQueries({ queryKey: planDetailQueryKey(planId) })
  }

  const addCostCenterMutation = useMutation({
    mutationFn: budgetPlansRepository.addCostCenter,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: budgetPlansRepository.addCategory,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const addSubcategoryMutation = useMutation({
    mutationFn: budgetPlansRepository.addSubcategory,
    onSuccess: (res) => {
      if (isErr(res)) {
        setErrorTag(res.error)
        return
      }
      invalidateDetail()
      setErrorTag(null)
      setFormMode({ kind: 'none' })
    },
    onError: () => {
      setErrorTag('unexpected')
    },
  })

  const submitting =
    addCostCenterMutation.isPending || addCategoryMutation.isPending || addSubcategoryMutation.isPending

  // Pré-preenche o form ao ENTRAR num modo de edição; add começa vazio. Limpa o erro anterior.
  const startForm = (mode: CentroFormMode): void => {
    setErrorTag(null)
    if (mode.kind === 'edit-centro') {
      const c = centros.find((x) => x.id === mode.centroId)
      setForm({ ...emptyCentroFormFields(), nome: c?.name ?? '', centroTipo: c?.type ?? 'A PAGAR' })
    } else if (mode.kind === 'edit-categoria') {
      const cat = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
      setForm({ ...emptyCentroFormFields(), nome: cat?.name ?? '' })
    } else if (mode.kind === 'edit-sub') {
      const sub = centros
        .find((x) => x.id === mode.centroId)
        ?.categories.find((y) => y.id === mode.categoriaId)
        ?.subCategories.find((s) => s.id === mode.subId)
      setForm({ ...emptyCentroFormFields(), nome: sub?.name ?? '' })
    } else {
      setForm(emptyCentroFormFields())
    }
    setFormMode(mode)
  }

  const submitForm = (): void => {
    const mode = formMode

    if (mode.kind === 'add-centro') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      setErrorTag(null)
      // Snapshot dos refs conhecidos AGORA (antes do POST) — o auto-select diffa contra ele na resposta, sem
      // depender do `centros` do render em que o onSuccess roda (que já pode ter relido a árvore com o novo nó).
      const knownRefs = new Set(centros.map((c) => c.ref))
      addCostCenterMutation.mutate(
        { planId, name: form.nome.trim(), direction: form.centroTipo },
        {
          onSuccess: (res) => {
            if (isErr(res)) return
            const created = res.value.costCenters.find((cc) => !knownRefs.has(cc.ref))
            if (created !== undefined) setPendingSelectRef(created.ref) // cascata: seleciona o centro novo
          },
        },
      )
      return
    }

    if (mode.kind === 'add-categoria') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      const parent = centros.find((c) => c.id === mode.centroId)
      if (parent?.ref === undefined) {
        setErrorTag('missing-parent')
        return
      }
      setErrorTag(null)
      addCategoryMutation.mutate({ planId, costCenterId: parent.ref, name: form.nome.trim() })
      return
    }

    if (mode.kind === 'add-sub') {
      const nameErr = validateCentroName(form.nome)
      if (nameErr !== null) {
        setErrorTag(nameErr)
        return
      }
      const parent = centros
        .find((c) => c.id === mode.centroId)
        ?.categories.find((cat) => cat.id === mode.categoriaId)
      if (parent?.ref === undefined) {
        setErrorTag('missing-parent')
        return
      }
      setErrorTag(null)
      addSubcategoryMutation.mutate({
        planId,
        categoryId: parent.ref,
        name: form.nome.trim(),
        launchType: form.releaseType,
      })
      return
    }

    // edit-* / none: escrita fora do escopo do Grupo B (sem endpoint) — fecha o painel (front-first).
    setFormMode({ kind: 'none' })
  }

  return {
    open,
    programName: detail?.programAbbreviation ?? '',
    centros,
    selectedCentroId: selectedCentro?.id ?? null,
    selectedCentro,
    formMode,
    form,
    centroTipoOptions: CENTRO_TIPO_OPTIONS,
    subTipoOptions: SUB_TIPO_OPTIONS,
    releaseTypeOptions: RELEASE_TYPE_OPTIONS,
    errorTag,
    submitting,
    isDeactivated: (kind, id) => deactivated.has(nodeKey(kind, id)),
    isCollapsed: (kind, id) => collapsed.has(nodeKey(kind, id)),
    toggleCollapse: (kind, id) => {
      const key = nodeKey(kind, id)
      setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    openModal: () => {
      setFormMode({ kind: 'none' })
      setErrorTag(null)
      setOpen(true)
    },
    close: () => {
      setOpen(false)
    },
    selectCentro: (id) => {
      setSelectedCentroId(id)
      setPendingSelectRef(null) // seleção manual sobrepõe o auto-select do centro recém-criado
      setFormMode({ kind: 'none' })
      setErrorTag(null)
    },
    startForm,
    cancelForm: () => {
      setFormMode({ kind: 'none' })
      setErrorTag(null)
    },
    setNome: (v) => {
      setForm((f) => ({ ...f, nome: v }))
      setErrorTag(null)
    },
    setCentroTipo: (v) => {
      setForm((f) => ({ ...f, centroTipo: v }))
    },
    setSubTipo: (v) => {
      setForm((f) => ({ ...f, subTipo: v }))
    },
    setReleaseType: (v) => {
      setForm((f) => ({ ...f, releaseType: v }))
    },
    submitForm,
    toggleDeactivate: (kind, id) => {
      const key = nodeKey(kind, id)
      setDeactivated((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
  }
}
