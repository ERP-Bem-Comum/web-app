/**
 * PlanInsightsModal (Vitest/jsdom) — feature 060. Cobre o render do estado `ready` (cabeçalho do ano atual +
 * uma linha por ano anterior com o delta) e do estado `loading`. View BURRA: tudo vem por props.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { buildInsightsView } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.view-model.ts'
import { PlanInsightsModal } from '#modules/budget-plans/client/planejamento/detalhe/components/plan-insights-modal.component.tsx'
import type { InsightsState } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.binding.ts'

const LABELS = {
  title: 'Insights do Plano',
  close: 'Fechar',
  currentTotal: 'Total do plano em',
  loading: 'Carregando os insights…',
  error: 'Erro',
  empty: 'Sem anos anteriores para comparar.',
}

const renderModal = (state: InsightsState) =>
  render(<PlanInsightsModal open state={state} labels={LABELS} onClose={() => undefined} />)

afterEach(cleanup)

describe('PlanInsightsModal (feature 060)', () => {
  it('ready → mostra o ano atual e uma linha por ano anterior', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000 },
      previousYears: [{ year: 2026, totalInCents: 200_000 }],
    })
    renderModal({ status: 'ready', view })

    expect(screen.getByText(/Total do plano em\s*2027/)).toBeTruthy()
    expect(screen.getByText('2026')).toBeTruthy()
    // Delta positivo (atual > anterior) com sinal.
    expect(screen.getByText(/^\+ /)).toBeTruthy()
  })

  it('loading → mostra o texto de carregando', () => {
    renderModal({ status: 'loading' })
    expect(screen.getByText('Carregando os insights…')).toBeTruthy()
  })

  it('fechado → não renderiza nada', () => {
    const { container } = render(
      <PlanInsightsModal open={false} state={{ status: 'idle' }} labels={LABELS} onClose={() => undefined} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
