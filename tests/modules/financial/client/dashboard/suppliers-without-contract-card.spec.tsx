/**
 * suppliers-without-contract-card (vitest/jsdom) — view BURRA do card (043): título + lista (nome+valor)
 * + botão "Ver todas". Clicar no botão dispara `onSeeAll`. Textos e itens chegam prontos por props.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { SuppliersWithoutContractCard } from '#modules/financial/client/dashboard/components/suppliers-without-contract-card.component.tsx'
import type { SupplierWithoutContract } from '#modules/financial/client/dashboard/dashboard-summary.view-model.ts'

const ITEMS: readonly SupplierWithoutContract[] = [
  { id: 'a', name: 'LUCAS GABRIEL', value: 'R$ 1.100,00' },
  { id: 'b', name: 'ELYS VANNY', value: 'R$ 11,00' },
]

afterEach(() => {
  cleanup()
})

describe('SuppliersWithoutContractCard', () => {
  it('renderiza o título, os itens da lista e o botão com o seeAllLabel', () => {
    render(
      <SuppliersWithoutContractCard
        title="Fornecedores sem contrato"
        seeAllLabel="Ver todas"
        items={ITEMS}
      />,
    )
    expect(screen.getByText('Fornecedores sem contrato')).toBeTruthy()
    expect(screen.getByText('LUCAS GABRIEL')).toBeTruthy()
    expect(screen.getByText('R$ 1.100,00')).toBeTruthy()
    expect(screen.getByText('ELYS VANNY')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver todas' })).toBeTruthy()
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
        items={ITEMS}
        onSeeAll={onSeeAll}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }))
    expect(called).toBe(true)
  })
})
