/**
 * PlanInsightsModal (Vitest/jsdom) — feature 060 + core-api#416. Cobre o render do estado `ready` (Histórico +
 * card do ano com Planejado/Realizado/média por rede + uma linha por ano anterior) e o `loading`. View BURRA:
 * tudo vem por props.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { buildInsightsView } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.view-model.ts'
import { PlanInsightsModal } from '#modules/budget-plans/client/planejamento/detalhe/components/plan-insights-modal.component.tsx'
import type { InsightsState } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.binding.ts'

const LABELS = {
  title: 'Plano Insight',
  subtitle: 'Use esses insights para planejar seu plano orçamentário.',
  close: 'Fechar',
  currentTotal: 'Total do plano em',
  loading: 'Carregando os insights…',
  error: 'Erro',
  empty: 'Sem anos anteriores para comparar.',
  history: 'Média de orçamento nos últimos 5 anos',
  historyChart: 'Evolução do orçamento planejado por ano',
  planned: 'Planejado',
  realized: 'Realizado',
  networksAvg: 'Média de',
  realizedSource: 'Realizado = soma dos lançamentos conciliados.',
}

const renderModal = (state: InsightsState) =>
  render(<PlanInsightsModal open state={state} labels={LABELS} onClose={() => undefined} />)

afterEach(cleanup)

describe('PlanInsightsModal (feature 060)', () => {
  it('ready → mostra o ano atual e uma linha por ano anterior', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: 250_000 },
      previousYears: [{ year: 2026, totalInCents: 200_000, realizedInCents: null }],
      networksCount: 3,
    })
    renderModal({ status: 'ready', view })

    expect(screen.getByText(/Total do plano em\s*2027/)).toBeTruthy()
    expect(screen.getByText('2026')).toBeTruthy()
    // Delta positivo (atual > anterior) com sinal.
    expect(screen.getByText(/^\+ /)).toBeTruthy()
  })

  it('ready → card do §1.6: Planejado · Realizado · Média de N redes + origem do Realizado', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: 250_000 },
      previousYears: [{ year: 2026, totalInCents: 200_000, realizedInCents: null }],
      networksCount: 3,
    })
    renderModal({ status: 'ready', view })

    expect(screen.getByText('Planejado')).toBeTruthy()
    expect(screen.getByText('Realizado')).toBeTruthy()
    expect(screen.getByText(/Média de\s*3 redes/)).toBeTruthy()
    expect(screen.getByText('Média de orçamento nos últimos 5 anos')).toBeTruthy()
    // A tela não deve deixar dúvida sobre de onde vem o Realizado (regra da P.O., §1.6).
    expect(screen.getByText('Realizado = soma dos lançamentos conciliados.')).toBeTruthy()
  })

  it('ready → core-api sem os campos do #416: mostra "—", nunca R$ 0,00', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: null },
      previousYears: [],
      networksCount: null,
    })
    renderModal({ status: 'ready', view })

    // 3 traços: Histórico, Realizado e a média por rede. Zero seria uma AFIRMAÇÃO falsa.
    expect(screen.getAllByText('—').length).toBe(3)
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

// O legado mostra uma linha de tendência ao lado da média (print da P.O.). Reproduzimos a ideia.
describe('PlanInsightsModal — gráfico do Histórico', () => {
  it('2+ anos → desenha a linha com um ponto por ano', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: null },
      previousYears: [
        { year: 2026, totalInCents: 200_000, realizedInCents: null },
        { year: 2025, totalInCents: 100_000, realizedInCents: null },
      ],
      networksCount: null,
    })
    const { container } = renderModal({ status: 'ready', view })

    expect(screen.getByRole('img', { name: 'Evolução do orçamento planejado por ano' })).toBeTruthy()
    // 3 pontos: 2025, 2026 + o ano atual (2027).
    expect(container.querySelectorAll('circle').length).toBe(3)
    expect(container.querySelector('polyline')).toBeTruthy()
  })

  it('só o ano atual → SEM gráfico (1 ponto não é tendência)', () => {
    const view = buildInsightsView({
      current: { year: 2027, totalInCents: 300_000, realizedInCents: null },
      previousYears: [],
      networksCount: null,
    })
    const { container } = renderModal({ status: 'ready', view })

    expect(container.querySelector('polyline')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
