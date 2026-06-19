/**
 * SearchCreatePane (Vitest/jsdom) — view burra (US3): seleção de títulos, soma/diferença, classificação
 * e gating do Conciliar. Recebe um binding mock por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { SearchCreatePane } from '#modules/financial/client/reconciliation-workspace/components/search-create-pane.component.tsx'
import type { SearchCreateBinding } from '#modules/financial/client/reconciliation-workspace/search-create.binding.ts'
import type { PaidPayable } from '#modules/financial/client/data/model/reconciliation.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const payables: readonly PaidPayable[] = [
  {
    id: 'p1',
    documentId: 'd1',
    valueCents: '100000',
    dueDate: '2026-06-10',
    paymentMethod: 'PIX',
    supplierName: null,
    documentNumber: '001',
  },
  {
    id: 'p2',
    documentId: 'd2',
    valueCents: '50000',
    dueDate: '2026-06-11',
    paymentMethod: 'TED',
    supplierName: null,
    documentNumber: '002',
  },
]

const baseBinding = (over: Partial<SearchCreateBinding> = {}): SearchCreateBinding => ({
  selectedIds: new Set(),
  treatment: null,
  selectedSumCents: 0,
  residualCents: 0,
  canReconcile: false,
  reconType: 'Individual',
  submitting: false,
  errorTag: null,
  toggle: vi.fn(),
  setTreatment: vi.fn(),
  clear: vi.fn(),
  submit: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('SearchCreatePane', () => {
  it('lista os títulos Pago e dispara toggle ao clicar', () => {
    const toggle = vi.fn()
    render(
      <SearchCreatePane binding={baseBinding({ toggle })} payables={payables} extratoValueCents="150000" />,
    )
    expect(screen.getByText('001')).toBeTruthy()
    fireEvent.click(screen.getByText('001'))
    expect(toggle).toHaveBeenCalledWith('p1')
  })

  it('com diferença, mostra as opções de tratamento; setTreatment ao clicar', () => {
    const setTreatment = vi.fn()
    render(
      <SearchCreatePane
        binding={baseBinding({
          selectedIds: new Set(['p1']),
          selectedSumCents: 100000,
          residualCents: 50000,
          setTreatment,
        })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    const juros = screen.getByRole('button', { name: tr('financial.recon.treatment.Interest') })
    fireEvent.click(juros)
    expect(setTreatment).toHaveBeenCalledWith('Interest')
  })

  it('Conciliar bloqueado quando não balanceia; habilitado e submete quando pode', () => {
    const submit = vi.fn()
    const { rerender } = render(
      <SearchCreatePane
        binding={baseBinding({ canReconcile: false })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(
      screen
        .getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.confirm')) })
        .hasAttribute('disabled'),
    ).toBe(true)
    rerender(
      <SearchCreatePane
        binding={baseBinding({ canReconcile: true, selectedIds: new Set(['p1', 'p2']), submit })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.confirm')) }),
    )
    expect(submit).toHaveBeenCalled()
  })
})
