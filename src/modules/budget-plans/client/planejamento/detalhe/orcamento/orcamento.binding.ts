/**
 * Binding da EDIÇÃO de Orçamento (US2.4) — ADAPTER React (§XI). Front-first: lê o placeholder do plano e
 * monta o grid CATEGORIAS×meses do centro de custo selecionado (ViewModel puro). Centro + semestre =
 * UI-state local. Salvar/Descartar/Calcular Gasto ficam para a 2.4b (aqui só o shell + grid).
 *
 * 🔁 TODO(#113): valores reais por parceiro + persistência do Salvar via server fn.
 */
import { useMemo, useState } from 'react'

import { planDetailPlaceholder } from '#modules/budget-plans/client/data/plan-detail.placeholder.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  buildOrcamentoMatrix,
  orcamentoCentroOptions,
  derivePlanDetailHeader,
  PLAN_FILTER_ESTADOS,
  type MatrixView,
  type RegionOption,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

export type OrcamentoState =
  | Readonly<{ status: 'not-found' }>
  | Readonly<{
      status: 'ready'
      title: string
      totalLabel: string
      centroName: string
      matrix: MatrixView
    }>

export type OrcamentoBinding = Readonly<{
  state: OrcamentoState
  /** Detalhe cru do plano — usado pelo modal "Calculando Gastos" (2.4b). */
  detail: PlanDetail | null
  centroOptions: readonly RegionOption[]
  centro: string
  setCentro: (value: string) => void
  apply: () => void
  prevSemester: () => void
  nextSemester: () => void
}>

const estadoLabelFor = (estado: string): string =>
  PLAN_FILTER_ESTADOS.find((e) => e.value === estado)?.label ?? estado

export function useOrcamento(id: number, estado: string): OrcamentoBinding {
  const detail = useMemo(() => planDetailPlaceholder(id), [id])
  const options = useMemo(() => (detail !== null ? orcamentoCentroOptions(detail) : []), [detail])
  const firstId = options[0] !== undefined ? Number(options[0].value) : null

  const [centro, setCentro] = useState<string>(firstId !== null ? String(firstId) : '')
  const [appliedCentro, setAppliedCentro] = useState<number | null>(firstId)
  const [semester, setSemester] = useState<Semester>(0)

  const state = useMemo<OrcamentoState>(() => {
    if (detail === null) return { status: 'not-found' }
    const centroId = appliedCentro ?? firstId
    if (centroId === null) return { status: 'not-found' }
    const matrix = buildOrcamentoMatrix(detail, centroId, semester)
    if (matrix === null) return { status: 'not-found' }
    const header = derivePlanDetailHeader(detail)
    const centroName = options.find((o) => o.value === String(centroId))?.label ?? ''
    return {
      status: 'ready',
      title: `${header.title} > ${estadoLabelFor(estado)}`,
      totalLabel: header.totalLabel,
      centroName,
      matrix,
    }
  }, [detail, appliedCentro, firstId, semester, options, estado])

  return {
    state,
    detail,
    centroOptions: options,
    centro,
    setCentro,
    apply: () => {
      setAppliedCentro(centro === '' ? null : Number(centro))
    },
    prevSemester: () => {
      setSemester(0)
    },
    nextSemester: () => {
      setSemester(1)
    },
  }
}
