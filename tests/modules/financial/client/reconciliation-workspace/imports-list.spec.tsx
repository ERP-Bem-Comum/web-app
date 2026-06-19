/**
 * ImportsList (Vitest/jsdom) — view burra: filtros, agrupamento por dia, linhas e seleção. Recebe o
 * estado derivado por props (sem hooks).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ImportsList } from '#modules/financial/client/reconciliation-workspace/components/imports-list.component.tsx'
import type {
  TxListState,
  FilterCounts,
} from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.binding.ts'
import type { StatementTransaction } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const tx = (
  over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
): StatementTransaction => ({
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Debit',
  entryType: 'TED',
  payeeName: 'Fornecedor X',
  memo: 'pagamento',
  valueCents: '150000',
  balanceAfterCents: '0',
  reconciliationStatus: 'Pending',
  ...over,
})

const ready: TxListState = {
  tag: 'ready',
  groups: [{ date: '2026-06-01', items: [tx({ id: 't1' }), tx({ id: 't2', payeeName: 'Outro' })] }],
}
const counts: FilterCounts = { pendentes: 2, conciliadas: 0, todas: 2 }

afterEach(() => {
  cleanup()
})

describe('ImportsList', () => {
  it('idle: mostra o estado honesto (importe um extrato)', () => {
    render(
      <ImportsList
        state={{ tag: 'idle' }}
        filter="pendentes"
        counts={counts}
        selectedId={null}
        onFilter={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.recon.list.idle'))).toBeTruthy()
  })

  it('ready: lista as linhas agrupadas por dia', () => {
    render(
      <ImportsList
        state={ready}
        filter="pendentes"
        counts={counts}
        selectedId={null}
        onFilter={vi.fn()}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('Fornecedor X')).toBeTruthy()
    expect(screen.getByText('Outro')).toBeTruthy()
    // a data aparece no divisor do dia e em cada linha
    expect(screen.getAllByText('2026-06-01').length).toBeGreaterThanOrEqual(1)
  })

  it('selecionar uma linha dispara onSelect com o id', () => {
    const onSelect = vi.fn()
    render(
      <ImportsList
        state={ready}
        filter="pendentes"
        counts={counts}
        selectedId={null}
        onFilter={vi.fn()}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByText('Fornecedor X'))
    expect(onSelect).toHaveBeenCalledWith('t1')
  })

  it('trocar o filtro dispara onFilter', () => {
    const onFilter = vi.fn()
    render(
      <ImportsList
        state={ready}
        filter="pendentes"
        counts={counts}
        selectedId={null}
        onFilter={onFilter}
        onSelect={vi.fn()}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.filter.todas')) }),
    )
    expect(onFilter).toHaveBeenCalledWith('todas')
  })
})
