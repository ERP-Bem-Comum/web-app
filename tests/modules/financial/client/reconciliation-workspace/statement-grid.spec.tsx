/**
 * StatementGrid (Vitest/jsdom) — view burra (US8): aba Extrato. Filtros, linhas e totais. Props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { StatementGrid } from '#modules/financial/client/reconciliation-workspace/components/statement-grid.component.tsx'
import type { StatementTransaction } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const tx = (
  over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
): StatementTransaction => ({
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Credit',
  entryType: 'PIX',
  payeeName: 'Entrada X',
  memo: '',
  valueCents: '30000',
  balanceAfterCents: '30000',
  reconciliationStatus: 'Reconciled',
  ...over,
})

const items = [
  tx({ id: 'in1' }),
  tx({ id: 'out1', movement: 'Debit', payeeName: 'Saída Y', valueCents: '12000' }),
]

afterEach(() => {
  cleanup()
})

describe('StatementGrid', () => {
  it('sem extrato: estado idle', () => {
    render(
      <StatementGrid
        hasStatement={false}
        items={[]}
        totals={{ inCents: 0, outCents: 0 }}
        filter="todos"
        onFilter={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.ext.idle'))).toBeTruthy()
  })

  it('com extrato: lista linhas e totais; filtro dispara onFilter', () => {
    const onFilter = vi.fn()
    render(
      <StatementGrid
        hasStatement
        items={items}
        totals={{ inCents: 30000, outCents: 12000 }}
        filter="todos"
        onFilter={onFilter}
      />,
    )
    expect(screen.getByText('Entrada X')).toBeTruthy()
    expect(screen.getByText('Saída Y')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.ext.filter.entradas') }))
    expect(onFilter).toHaveBeenCalledWith('entradas')
  })
})
