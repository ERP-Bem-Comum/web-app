/**
 * donut-chart (vitest/jsdom) — view BURRA do donut (043) em SVG nativo. Fatias vazias → mensagem de
 * estado vazio, SEM svg. Com fatias não-vazias → svg role="img" com um <circle> por fatia. `sliceLabel`
 * resolve a key da fatia.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { DonutChart } from '#modules/financial/client/dashboard/components/donut-chart.component.tsx'
import type { DonutSlice } from '#modules/financial/client/dashboard/dashboard-summary.view-model.ts'

afterEach(() => {
  cleanup()
})

const sliceLabel = (s: DonutSlice): string => s.labelKey

describe('DonutChart', () => {
  it('slices vazio → mostra emptyLabel e NÃO renderiza svg', () => {
    render(<DonutChart slices={[]} emptyLabel="Sem dados" sliceLabel={sliceLabel} />)
    expect(screen.getByText('Sem dados')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('fatias não-vazias → svg role="img" com um <circle> por fatia', () => {
    const slices: readonly DonutSlice[] = [
      { id: 's1', labelKey: 'donut.slice.a', value: 60, accent: 'red' },
      { id: 's2', labelKey: 'donut.slice.b', value: 40, accent: 'green' },
    ]
    const { container } = render(
      <DonutChart slices={slices} emptyLabel="Sem dados" sliceLabel={sliceLabel} />,
    )
    expect(screen.getByRole('img')).toBeTruthy()
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    // legenda com as keys resolvidas por sliceLabel
    expect(screen.getByText('donut.slice.a')).toBeTruthy()
    expect(screen.getByText('donut.slice.b')).toBeTruthy()
  })
})
