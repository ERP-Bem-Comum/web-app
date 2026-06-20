/**
 * SuggestionPane (Vitest/jsdom) — view burra: match card (extrato × título), critérios, Conciliar/
 * Rejeitar e alternativas. Recebe o estado derivado por props (sem hooks).
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { SuggestionPane } from '#modules/financial/client/reconciliation-workspace/components/suggestion-pane.component.tsx'
import type { SuggestionState } from '#modules/financial/client/reconciliation-workspace/reconciliation-workspace.binding.ts'
import type { StatementTransaction } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const selectedTx: StatementTransaction = {
  id: 't1',
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Debit',
  entryType: 'PIX',
  payeeName: 'Fornecedor X',
  memo: 'pix enviado',
  valueCents: '150000',
  balanceAfterCents: '0',
  reconciliationStatus: 'Pending',
}

const ready: SuggestionState = {
  tag: 'ready',
  top: {
    payableId: 'p1',
    score: 87,
    band: 'alta',
    criteria: { payeeMatch: true, exactValue: true, dateD0: true, memoRef: false, supplierOpenCount: 1 },
    criteriaBreakdown: [
      { criterion: 'exactValue', weight: 40, result: 'ok', detail: '' },
      { criterion: 'memoRef', weight: 10, result: 'falha', detail: '' },
      { criterion: 'supplierOpen', weight: 5, result: 'parcial', detail: '2' },
    ],
    payable: {
      id: 'p1',
      documentId: 'DOC-1',
      valueCents: '150000',
      dueDate: '2026-06-10',
      paymentMethod: 'PIX',
      supplierName: null,
      documentNumber: '0847',
      category: null,
      documentType: null,
    },
  },
  alternatives: [],
}

const base = {
  selectedTx,
  reconciling: false,
  rejecting: false,
  errorTag: null,
  onReconcile: vi.fn(),
  onReject: vi.fn(),
}

afterEach(() => {
  cleanup()
})

describe('SuggestionPane', () => {
  it('idle: pede para selecionar uma movimentação', () => {
    render(<SuggestionPane {...base} state={{ tag: 'idle' }} selectedTx={null} />)
    expect(screen.getByText(tr('financial.recon.sugg.idle'))).toBeTruthy()
  })

  it('none: anuncia que não há palpite', () => {
    render(<SuggestionPane {...base} state={{ tag: 'none' }} />)
    expect(screen.getByText(tr('financial.recon.sugg.none'))).toBeTruthy()
  })

  it('ready: mostra o match card de alta confiança + valor do título', () => {
    render(<SuggestionPane {...base} state={ready} />)
    expect(screen.getByText(tr('financial.recon.sugg.high'))).toBeTruthy()
    expect(screen.getByText('87%')).toBeTruthy()
    expect(screen.getByText('0847')).toBeTruthy() // documentNumber (mínimo #172)
  })

  it('#140: renderiza chips do breakdown com peso e count do supplierOpen', () => {
    render(<SuggestionPane {...base} state={ready} />)
    // rótulo do critério novo + count do supplierOpen (parcial) no mesmo span
    expect(screen.getByText(`${tr('financial.recon.crit.supplierOpen')} (2)`)).toBeTruthy()
    expect(screen.getByText('40')).toBeTruthy() // peso (badge) do exactValue
    expect(screen.getByText('5')).toBeTruthy() // peso do supplierOpen
  })

  it('#140: breakdown vazio cai no fallback dos chips booleanos', () => {
    const noBreakdown: SuggestionState = {
      ...ready,
      top: { ...ready.top, criteriaBreakdown: [] },
    }
    render(<SuggestionPane {...base} state={noBreakdown} />)
    expect(screen.getByText(tr('financial.recon.crit.payeeMatch'))).toBeTruthy()
    // sem breakdown não há badge de peso
    expect(screen.queryByText('40')).toBeNull()
  })

  it('Conciliar dispara onReconcile com o payableId', () => {
    const onReconcile = vi.fn()
    render(<SuggestionPane {...base} state={ready} onReconcile={onReconcile} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.sugg.confirm')) }),
    )
    expect(onReconcile).toHaveBeenCalledWith('p1')
  })

  it('Rejeitar dispara onReject com o payableId', () => {
    const onReject = vi.fn()
    render(<SuggestionPane {...base} state={ready} onReject={onReject} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.sugg.reject')) }),
    )
    expect(onReject).toHaveBeenCalledWith('p1')
  })
})
