/**
 * metric-card (vitest/jsdom) — view BURRA do card de métrica (043). Recebe tudo por props e só
 * apresenta: rótulo, valor, percentual de tendência e legenda. Smoke p/ cada accent e icon (não quebra
 * o render). `t` passthrough (retorna a key) — aqui os textos já chegam prontos por props.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { MetricCard } from '#modules/financial/client/dashboard/components/metric-card.component.tsx'
import type {
  MetricAccent,
  MetricIconName,
} from '#modules/financial/client/dashboard/dashboard-summary.view-model.ts'

afterEach(() => {
  cleanup()
})

describe('MetricCard', () => {
  it('renderiza label, value, trendPercent e trendLabel', () => {
    render(
      <MetricCard
        label="Despesas"
        value="R$ 1.234,00"
        trendPercent="12%"
        trendLabel="vs. mês anterior"
        accent="red"
        icon="wallet"
      />,
    )
    expect(screen.getByText('Despesas')).toBeTruthy()
    expect(screen.getByText('R$ 1.234,00')).toBeTruthy()
    expect(screen.getByText('12%')).toBeTruthy()
    // a legenda da tendência é renderizada ao lado do percentual (sem separador)
    expect(screen.getByText(/vs\. mês anterior/)).toBeTruthy()
  })

  it('smoke: cada accent renderiza sem quebrar', () => {
    const accents: readonly MetricAccent[] = ['red', 'green', 'indigo', 'orange']
    for (const accent of accents) {
      const { unmount } = render(
        <MetricCard
          label={`card-${accent}`}
          value="R$ 0,00"
          trendPercent="0%"
          trendLabel="legenda"
          accent={accent}
          icon="wallet"
        />,
      )
      expect(screen.getByText(`card-${accent}`)).toBeTruthy()
      unmount()
    }
  })

  it('smoke: cada icon renderiza sem quebrar', () => {
    const icons: readonly MetricIconName[] = ['wallet', 'trending-up', 'heart-handshake', 'users']
    for (const icon of icons) {
      const { unmount } = render(
        <MetricCard
          label={`icon-${icon}`}
          value="R$ 0,00"
          trendPercent="0%"
          trendLabel="legenda"
          accent="green"
          icon={icon}
        />,
      )
      expect(screen.getByText(`icon-${icon}`)).toBeTruthy()
      unmount()
    }
  })
})
