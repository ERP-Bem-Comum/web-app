/**
 * suppliers-without-contract-card (vitest/jsdom) — view BURRA do card (043 → modelo de compliance): título +
 * GRÁFICO de barras (nome + track com marcador de Limite + fill por status + % ao lado) + botão "Ver todas".
 * Barras chegam prontas por props (nome + status + % bruta + textos formatados). Hover mostra o tooltip HTML
 * (nome + valor R$ + %). Clicar no botão dispara `onSeeAll`. Estado vazio mostra `emptyLabel`.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  SuppliersWithoutContractCard,
  type SupplierBar,
} from '#modules/financial/client/dashboard/components/suppliers-without-contract-card.component.tsx'

const BARS: readonly SupplierBar[] = [
  {
    id: 'over',
    name: 'WEE TRAVEL',
    utilizadoPct: 129.82,
    status: 'over',
    percentLabel: '129,82%',
    valueLabel: 'R$ 12.981,85',
  },
  {
    id: 'within',
    name: 'POLO MOVEIS',
    utilizadoPct: 74.2,
    status: 'within',
    percentLabel: '74,20%',
    valueLabel: 'R$ 7.420,00',
  },
]

afterEach(() => {
  cleanup()
})

describe('SuppliersWithoutContractCard', () => {
  it('renderiza o título, os nomes das barras, os % e o botão com o seeAllLabel', () => {
    render(
      <SuppliersWithoutContractCard
        title="Fornecedores sem contrato"
        seeAllLabel="Ver todas"
        emptyLabel="Nenhum fornecedor sem contrato."
        bars={BARS}
        animate={false}
      />,
    )
    expect(screen.getByText('Fornecedores sem contrato')).toBeTruthy()
    expect(screen.getByText('WEE TRAVEL')).toBeTruthy()
    expect(screen.getByText('129,82%')).toBeTruthy()
    expect(screen.getByText('POLO MOVEIS')).toBeTruthy()
    expect(screen.getByText('74,20%')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver todas' })).toBeTruthy()
  })

  it('mostra o estado vazio (emptyLabel) quando não há barras', () => {
    render(
      <SuppliersWithoutContractCard
        title="Fornecedores sem contrato"
        seeAllLabel="Ver todas"
        emptyLabel="Nenhum fornecedor sem contrato."
        bars={[]}
        animate={false}
      />,
    )
    expect(screen.getByText('Nenhum fornecedor sem contrato.')).toBeTruthy()
    // O botão continua presente mesmo no vazio.
    expect(screen.getByRole('button', { name: 'Ver todas' })).toBeTruthy()
  })

  it('hover sobre uma barra revela o tooltip com nome + valor R$ + %', () => {
    const { container } = render(
      <SuppliersWithoutContractCard
        title="Fornecedores sem contrato"
        seeAllLabel="Ver todas"
        emptyLabel="Nenhum fornecedor sem contrato."
        bars={BARS}
        animate
      />,
    )
    // Sem hover ainda: nenhum tooltip (role="status").
    expect(screen.queryByRole('status')).toBeNull()

    // A 1ª barra é o 1º grid-row dentro do container relativo (irmão do <h3>/<button>).
    const rows = container.querySelectorAll('section > div > div')
    const firstBar = rows[0]
    expect(firstBar).toBeTruthy()
    if (!firstBar) throw new Error('barra não encontrada')
    fireEvent.mouseMove(firstBar)

    const tip = screen.getByRole('status')
    expect(tip.textContent).toContain('WEE TRAVEL')
    expect(tip.textContent).toContain('R$ 12.981,85')
    expect(tip.textContent).toContain('129,82%')
  })

  it('clicar no botão chama onSeeAll', () => {
    let called = false
    const onSeeAll = (): void => {
      called = true
    }
    render(
      <SuppliersWithoutContractCard
        title="Fornecedores sem contrato"
        seeAllLabel="Ver todas"
        emptyLabel="Nenhum fornecedor sem contrato."
        bars={BARS}
        animate={false}
        onSeeAll={onSeeAll}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }))
    expect(called).toBe(true)
  })
})
