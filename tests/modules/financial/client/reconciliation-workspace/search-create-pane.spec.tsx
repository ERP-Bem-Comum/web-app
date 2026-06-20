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
    supplierName: 'Fornecedor Um',
    documentNumber: '001',
    category: 'Serviços / Consultoria',
    documentType: 'NFS-e',
  },
  {
    id: 'p2',
    documentId: 'd2',
    valueCents: '50000',
    dueDate: '2026-06-11',
    paymentMethod: 'TED',
    supplierName: 'Fornecedor Dois',
    documentNumber: '002',
    category: 'Imposto / ISS',
    documentType: 'ISS',
  },
]

const baseBinding = (over: Partial<SearchCreateBinding> = {}): SearchCreateBinding => ({
  selectedIds: new Set(),
  treatment: null,
  selectedSumCents: 0,
  residualCents: 0,
  canReconcile: false,
  canConfirm: false,
  showTreatment: false,
  reconType: 'Individual',
  submitting: false,
  errorTag: null,
  search: '',
  typeBucket: 'all',
  typeOptions: ['NFS-e', 'ISS'],
  filtered: payables,
  totalCount: payables.length,
  setSearch: vi.fn(),
  setTypeBucket: vi.fn(),
  toggle: vi.fn(),
  setTreatment: vi.fn(),
  clear: vi.fn(),
  confirm: vi.fn(),
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

  it('#9.4.6: com diferença mas SEM revelar, o painel de tratamento NÃO aparece', () => {
    render(
      <SearchCreatePane
        binding={baseBinding({
          selectedIds: new Set(['p1']),
          selectedSumCents: 100000,
          residualCents: 50000,
          showTreatment: false, // ainda não clicou Conciliar
        })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    expect(screen.queryByText(tr('financial.recon.multi.diffTreat'))).toBeNull()
    expect(screen.queryByRole('button', { name: tr('financial.recon.treatment.Interest') })).toBeNull()
  })

  it('#9.4.6: com showTreatment, mostra as opções; setTreatment ao clicar', () => {
    const setTreatment = vi.fn()
    render(
      <SearchCreatePane
        binding={baseBinding({
          selectedIds: new Set(['p1']),
          selectedSumCents: 100000,
          residualCents: 50000,
          showTreatment: true,
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

  it('Conciliar bloqueado quando !canConfirm; habilitado dispara confirm', () => {
    const confirm = vi.fn()
    const { rerender } = render(
      <SearchCreatePane
        binding={baseBinding({ canConfirm: false })}
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
        binding={baseBinding({ canConfirm: true, selectedIds: new Set(['p1', 'p2']), confirm })}
        payables={payables}
        extratoValueCents="150000"
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.multi.confirm')) }),
    )
    expect(confirm).toHaveBeenCalled()
  })
})
