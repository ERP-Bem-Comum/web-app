/**
 * Testes DOM (Vitest + jsdom) da matriz consolidada (view burra §1.4): cabeçalhos por visão (mês/rede),
 * linhas em árvore expansíveis (chevron), linha TOTAL, navegação de semestre e toggles de visão. Os dados
 * chegam como `MatrixView` já derivado pelo ViewModel puro.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ConsolidatedMatrix } from '#modules/budget-plans/client/planejamento/detalhe/components/consolidated-matrix.component.tsx'
import {
  buildMonthlyMatrix,
  buildNetworkMatrix,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'
import type { PlanDetail, MonthlyCents } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

afterEach(() => {
  cleanup()
})

const m = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const detail: PlanDetail = {
  id: 3,
  year: 2026,
  programName: 'Ensino de Tempo Integral',
  programAbbreviation: 'ETI',
  version: 1.2,
  scenarioName: null,
  status: 'RASCUNHO',
  totalInCents: 3_243_872,
  networks: [{ id: 1, name: 'Acre' }],
  costCenters: [
    {
      id: 1,
      name: 'Consultoria',
      type: 'A PAGAR',
      totalInCents: 3_243_872,
      monthlyInCents: m({ 2: 1_621_936, 3: 1_621_936 }),
      networkInCents: [3_243_872],
      categories: [
        {
          id: 11,
          name: 'Consultoria Educacional',
          totalInCents: 3_243_872,
          monthlyInCents: m({ 2: 1_621_936, 3: 1_621_936 }),
          networkInCents: [3_243_872],
          subCategories: [
            {
              id: 111,
              name: 'Formação de professores',
              totalInCents: 3_243_872,
              monthlyInCents: m({ 2: 1_621_936, 3: 1_621_936 }),
              networkInCents: [3_243_872],
            },
          ],
        },
      ],
    },
  ],
}

const labels = {
  sectionTitle: 'Consolidado por Mês',
  centroCusto: 'Centro de Custo',
  porMes: 'Por Mês',
  porRede: 'Por Rede',
  prev: 'Semestre anterior',
  next: 'Próximo semestre',
  centrosHeader: 'Centros de Custo',
  total: 'TOTAL',
  expand: 'Expandir',
  collapse: 'Recolher',
}

const noop = (): void => undefined

type Handlers = Readonly<{
  onPrev?: () => void
  onNext?: () => void
  onSelectCentroCusto?: () => void
  onSelectPorMes?: () => void
  onSelectPorRede?: () => void
}>

const renderMatrix = (matrix: ReturnType<typeof buildMonthlyMatrix>, handlers: Handlers = {}) =>
  render(
    <ConsolidatedMatrix
      matrix={matrix}
      labels={labels}
      onPrev={handlers.onPrev ?? noop}
      onNext={handlers.onNext ?? noop}
      onSelectCentroCusto={handlers.onSelectCentroCusto ?? noop}
      onSelectPorMes={handlers.onSelectPorMes ?? noop}
      onSelectPorRede={handlers.onSelectPorRede ?? noop}
    />,
  )

describe('ConsolidatedMatrix — visão Por Mês', () => {
  it('renderiza cabeçalhos de mês, TOTAL e navegação', () => {
    renderMatrix(buildMonthlyMatrix(detail, 0))
    expect(screen.getByText('JANEIRO')).toBeTruthy()
    expect(screen.getByText('JUNHO')).toBeTruthy()
    expect(screen.getByText('Consultoria - A PAGAR')).toBeTruthy()
    expect(screen.getByText(/TOTAL/)).toBeTruthy()
    // ‹ desabilitado no 1º semestre, › habilitado
    expect(screen.getByLabelText('Semestre anterior').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Próximo semestre').hasAttribute('disabled')).toBe(false)
    // toggle ativo = Por Mês
    expect(screen.getByText('Por Mês').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('Por Rede').getAttribute('aria-pressed')).toBe('false')
  })

  it('expande o centro de custo revelando a categoria', () => {
    renderMatrix(buildMonthlyMatrix(detail, 0))
    expect(screen.queryByText('Consultoria Educacional')).toBeNull()
    fireEvent.click(screen.getByLabelText('Expandir'))
    expect(screen.getByText('Consultoria Educacional')).toBeTruthy()
  })

  it('aciona a troca de visão Por Rede', () => {
    const onSelectPorRede = vi.fn()
    renderMatrix(buildMonthlyMatrix(detail, 0), { onSelectPorRede })
    fireEvent.click(screen.getByText('Por Rede'))
    expect(onSelectPorRede).toHaveBeenCalledOnce()
  })
})

describe('ConsolidatedMatrix — visão Por Rede', () => {
  it('renderiza coluna da rede, sem navegação de semestre habilitada', () => {
    renderMatrix(buildNetworkMatrix(detail))
    expect(screen.getByText('ACRE')).toBeTruthy()
    expect(screen.getByText('Por Rede').getAttribute('aria-pressed')).toBe('true')
    // nav de semestre desabilitada fora da visão por mês
    expect(screen.getByLabelText('Semestre anterior').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Próximo semestre').hasAttribute('disabled')).toBe(true)
  })
})
