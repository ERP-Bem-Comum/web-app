/**
 * Binding da EDIÇÃO de Orçamento (§1.7) — ADAPTER React (§XI). Lê a grade REAL do core-api
 * (`budgetPlansRepository.getBudgetGrid`) e monta o grid CATEGORIAS×meses do centro de custo selecionado
 * (ViewModel puro). Centro + semestre = UI-state local.
 *
 * Os valores são MENSAIS (core-api#413): a tela é exatamente onde o usuário orça mês a mês, como no legado —
 * o anual é a soma dos 12, nunca um campo separado.
 *
 * O BFF entrega a grade PRONTA (§III) a partir do `?estado=` da URL: ele resolve a rede→orçamento e preenche
 * os 12 meses. O `budgetId` volta resolvido e fica guardado aqui só p/ a ESCRITA (Salvar — próxima fatia).
 *
 * 🔁 TODO(#113): persistência do Salvar (esta fatia é a LEITURA).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import {
  buildOrcamentoMatrix,
  orcamentoCentroOptions,
  derivePlanDetailHeader,
  type MatrixView,
  type RegionOption,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

/** Query key da grade — por (plano, rede): trocar de rede é OUTRA grade, não a mesma revalidada. */
export const budgetGridQueryKey = (
  planId: string,
  networkRef: string,
): readonly ['budget-plans', 'budget-grid', string, string] => [
  'budget-plans',
  'budget-grid',
  planId,
  networkRef,
]

export type OrcamentoState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: BudgetPlansError }>
  // Cobre plano inexistente, rede fora do plano (404 do BFF) e plano sem centro de custo — nos 3 não há grade.
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
  /** Detalhe cru do plano — usado pelo modal "Calculando Gastos". */
  detail: PlanDetail | null
  /** Id do orçamento desta rede, resolvido pelo BFF — insumo do Salvar (próxima fatia). */
  budgetId: string | null
  centroOptions: readonly RegionOption[]
  centro: string
  setCentro: (value: string) => void
  apply: () => void
  prevSemester: () => void
  nextSemester: () => void
}>

export function useOrcamento(id: string, estado: string): OrcamentoBinding {
  const query = useQuery({
    queryKey: budgetGridQueryKey(id, estado),
    queryFn: () => budgetPlansRepository.getBudgetGrid(id, estado),
    // Sem `?estado=` não existe rede a editar — não vale gastar a ida ao servidor pra ouvir 404.
    enabled: estado !== '',
  })

  const grid = query.data?.ok === true ? query.data.value : null
  const errorTag: BudgetPlansError | null = query.data?.ok === false ? query.data.error : null
  const detail = grid?.detail ?? null

  const options = useMemo(() => (detail !== null ? orcamentoCentroOptions(detail) : []), [detail])
  const firstId = options[0] !== undefined ? Number(options[0].value) : null

  const [centro, setCentro] = useState<string>('')
  const [appliedCentro, setAppliedCentro] = useState<number | null>(null)
  const [semester, setSemester] = useState<Semester>(0)

  const state = useMemo<OrcamentoState>(() => {
    if (estado !== '' && query.isPending) return { status: 'loading' }
    if (errorTag !== null) return { status: 'error', errorTag }
    if (grid === null || detail === null) return { status: 'not-found' }

    // O centro só existe depois que a grade chega, então o "aplicado" cai no primeiro até o usuário escolher.
    const centroId = appliedCentro ?? firstId
    if (centroId === null) return { status: 'not-found' } // plano sem centro de custo: não há o que orçar

    const matrix = buildOrcamentoMatrix(detail, centroId, semester)
    if (matrix === null) return { status: 'not-found' }

    const header = derivePlanDetailHeader(detail)
    const centroName = options.find((o) => o.value === String(centroId))?.label ?? ''
    return {
      status: 'ready',
      // O rótulo da rede vem do BFF (nome real do parceiro), não de uma lista fixa de UFs no front.
      title: `${header.title} > ${grid.networkLabel}`,
      totalLabel: header.totalLabel,
      centroName,
      matrix,
    }
  }, [estado, query.isPending, errorTag, grid, detail, appliedCentro, firstId, semester, options])

  // As opções só existem DEPOIS que a grade chega, então o select cai no primeiro centro até o usuário
  // escolher. Derivado no render (não `setState` em efeito): o estado é do usuário; o default é do dado.
  const centroValue = centro !== '' ? centro : firstId !== null ? String(firstId) : ''

  return {
    state,
    detail,
    budgetId: grid?.budgetId ?? null,
    centroOptions: options,
    centro: centroValue,
    setCentro,
    apply: () => {
      setAppliedCentro(centroValue === '' ? null : Number(centroValue))
    },
    prevSemester: () => {
      setSemester(0)
    },
    nextSemester: () => {
      setSemester(1)
    },
  }
}
