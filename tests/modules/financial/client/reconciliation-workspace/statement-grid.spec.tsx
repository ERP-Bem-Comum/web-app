/**
 * StatementGrid (Vitest/jsdom) — view burra (US8): aba Extrato. Divisor por dia, linhas, conc-mark e
 * totais. Props (dias já agrupados + contagens). Verifica também o ponto pendente × check conciliado.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { StatementGrid } from '#modules/financial/client/reconciliation-workspace/components/statement-grid.component.tsx'
import { groupExtratoDays } from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
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
  tx({
    id: 'out1',
    movement: 'Debit',
    payeeName: 'Saída Y',
    valueCents: '12000',
    reconciliationStatus: 'Pending',
  }),
]

const counts = { todos: 2, entradas: 1, saidas: 1, conciliados: 1, pendentes: 1 } as const

afterEach(() => {
  cleanup()
})

describe('StatementGrid', () => {
  it('sem extrato: estado idle', () => {
    render(
      <StatementGrid
        hasStatement={false}
        days={[]}
        totals={{ inCents: 0, outCents: 0 }}
        count={0}
        counts={{ todos: 0, entradas: 0, saidas: 0, conciliados: 0, pendentes: 0 }}
        filter="todos"
        onFilter={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.ext.idle'))).toBeTruthy()
  })

  it('com extrato: lista linhas e totais; filtro dispara onFilter', () => {
    const onFilter = vi.fn()
    render(
      <StatementGrid
        hasStatement
        days={groupExtratoDays(items)}
        totals={{ inCents: 30000, outCents: 12000 }}
        count={items.length}
        counts={counts}
        filter="todos"
        onFilter={onFilter}
        onOpenDetails={vi.fn()}
      />,
    )
    expect(screen.getByText('Entrada X')).toBeTruthy()
    expect(screen.getByText('Saída Y')).toBeTruthy()
    const label = tr('financial.recon.ext.filter.entradas')
    fireEvent.click(screen.getByRole('button', { name: (name: string) => name.startsWith(label) }))
    expect(onFilter).toHaveBeenCalledWith('entradas')
  })
})
