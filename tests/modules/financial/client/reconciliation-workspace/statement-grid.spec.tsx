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
        expandedIds={new Set()}
        onToggleExpanded={vi.fn()}
        onOpenTitle={vi.fn()}
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
        expandedIds={new Set()}
        onToggleExpanded={vi.fn()}
        onOpenTitle={vi.fn()}
      />,
    )
    expect(screen.getByText('Entrada X')).toBeTruthy()
    expect(screen.getByText('Saída Y')).toBeTruthy()
    const label = tr('financial.recon.ext.filter.entradas')
    fireEvent.click(screen.getByRole('button', { name: (name: string) => name.startsWith(label) }))
    expect(onFilter).toHaveBeenCalledWith('entradas')
  })

  describe('lote (spec 132)', () => {
    const title = (payableId: string, cents: string) => ({
      payableId,
      documentNumber: `NF ${payableId}`,
      payeeName: `Fornecedor ${payableId}`,
      retentionType: null,
      dueDate: '2026-08-27',
      reconciledValueCents: cents,
    })
    const lote = tx({
      id: 'lote',
      movement: 'Debit',
      payeeName: '',
      memo: 'TED FORNECEDOR - DOC 24184489',
      valueCents: '270000',
      reconciliation: { reconciliationId: 'rec', titles: [title('a', '120000'), title('b', '150000')] },
    })
    const individual = tx({
      id: 'ind',
      movement: 'Debit',
      memo: 'TED FORNECEDOR - DOC 5555',
      reconciliation: { reconciliationId: 'rec2', titles: [title('c', '30000')] },
    })
    const renderGrid = (expanded: boolean) => {
      const handlers = { details: vi.fn(), toggle: vi.fn(), title: vi.fn() }
      render(
        <StatementGrid
          hasStatement
          days={groupExtratoDays([lote, individual])}
          totals={{ inCents: 0, outCents: 300000 }}
          count={2}
          counts={counts}
          filter="todos"
          onFilter={vi.fn()}
          onOpenDetails={handlers.details}
          expandedIds={new Set(expanded ? ['lote'] : [])}
          onToggleExpanded={handlers.toggle}
          onOpenTitle={handlers.title}
        />,
      )
      return handlers
    }

    it('só o lote tem seta e tag; a seta expande sem abrir o modal', () => {
      const h = renderGrid(false)
      const toggles = screen.getAllByRole('button', { name: tr('financial.recon.ext.batch.expand') })
      expect(toggles).toHaveLength(1)
      expect(screen.getAllByText(/Baixa em lote/)).toHaveLength(1)
      expect(screen.queryByText('NF a')).toBeNull()
      const [toggle] = toggles
      if (toggle === undefined) throw new Error('seta ausente')
      fireEvent.click(toggle)
      expect(h.toggle).toHaveBeenCalledWith('lote')
      expect(h.details).not.toHaveBeenCalled()
    })

    it('aberto: lista os títulos e o total; clicar no título abre o modal individual', () => {
      const h = renderGrid(true)
      expect(screen.getByText('Fornecedor a')).toBeTruthy()
      expect(screen.getByText(/títulos vinculados/)).toBeTruthy()
      fireEvent.click(screen.getByText('NF b'))
      expect(h.title).toHaveBeenCalledWith(expect.objectContaining({ id: 'lote' }), 'b')
      expect(h.details).not.toHaveBeenCalled()
    })

    it('clicar na linha do lote abre o modal do lote', () => {
      const h = renderGrid(false)
      fireEvent.click(screen.getByText(/TED FORNECEDOR - DOC 24184489/))
      expect(h.details).toHaveBeenCalledWith(expect.objectContaining({ id: 'lote' }))
    })
  })
})
