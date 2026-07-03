/**
 * Binding do modal "Centros de Custo" (§1.5) — ADAPTER React (§XI). UI-state: aberto, centro selecionado
 * (qual árvore exibir), modo do painel de formulário, campos do form e o conjunto (visual) de nós desativados.
 * Front-first: submeter/desativar NÃO persiste (a escrita real chega com o #113) — só reflete na UI.
 */
import { useMemo, useState } from 'react'

import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  buildCentrosTree,
  emptyCentroFormFields,
  nodeKey,
  CENTRO_TIPO_OPTIONS,
  SUB_TIPO_OPTIONS,
  RELEASE_TYPE_OPTIONS,
  type CentroNode,
  type CentroFormMode,
  type CentroFormFields,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.view-model.ts'
import type {
  CostCenterType,
  SubCategoryType,
  ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

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

export function useCentrosCusto(detail: PlanDetail | null): CentrosCustoBinding {
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

  const selectedCentro = centros.find((c) => c.id === selectedCentroId) ?? centros[0] ?? null

  // Pré-preenche o form ao ENTRAR num modo de edição; add começa vazio.
  const startForm = (mode: CentroFormMode): void => {
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
      setOpen(true)
    },
    close: () => {
      setOpen(false)
    },
    selectCentro: (id) => {
      setSelectedCentroId(id)
      setFormMode({ kind: 'none' })
    },
    startForm,
    cancelForm: () => {
      setFormMode({ kind: 'none' })
    },
    setNome: (v) => {
      setForm((f) => ({ ...f, nome: v }))
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
    submitForm: () => {
      // Front-first: sem persistência (#113) — fecha o painel de formulário e volta à árvore.
      setFormMode({ kind: 'none' })
    },
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
