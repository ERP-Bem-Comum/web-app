/**
 * NewTransactionPane (Vitest/jsdom) — view burra (US4): cards de tipo; Transferência exige destino +
 * confirmação consciente (gating). Recebe um binding mock por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { NewTransactionPane } from '#modules/financial/client/reconciliation-workspace/components/new-transaction-pane.component.tsx'
import type { ManualEntryBinding } from '#modules/financial/client/reconciliation-workspace/manual-entry.binding.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const baseBinding = (over: Partial<ManualEntryBinding> = {}): ManualEntryBinding => ({
  type: null,
  description: '',
  destinationAccount: '',
  consciousConfirm: false,
  needsDestination: false,
  showPayeeBlock: false,
  canSubmit: false,
  submitting: false,
  errorTag: null,
  supplierRef: '',
  programRef: '',
  partnerOptions: [],
  programOptions: [],
  setType: vi.fn(),
  setDescription: vi.fn(),
  setDestinationAccount: vi.fn(),
  setConsciousConfirm: vi.fn(),
  setSupplierRef: vi.fn(),
  setProgramRef: vi.fn(),
  reset: vi.fn(),
  submit: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('NewTransactionPane', () => {
  it('clicar num tipo dispara setType', () => {
    const setType = vi.fn()
    render(<NewTransactionPane binding={baseBinding({ setType })} />)
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.manualType.Transfer') }))
    expect(setType).toHaveBeenCalledWith('Transfer')
  })

  it('Transferência mostra aviso + destino + confirmação consciente (campos do tipo)', () => {
    render(<NewTransactionPane binding={baseBinding({ type: 'Transfer', needsDestination: true })} />)
    expect(screen.getByText(tr('financial.recon.manual.dest.Transfer.warning'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.manual.dest.Transfer.label'))).toBeTruthy()
    const confirm = screen.getByRole('checkbox')
    fireEvent.click(confirm)
    // setConsciousConfirm é chamado ao alternar a confirmação consciente
  })

  it('Pagamento mostra o bloco de documento (fornecedor); Tarifa não', () => {
    const { rerender } = render(
      <NewTransactionPane binding={baseBinding({ type: 'Payment', showPayeeBlock: true })} />,
    )
    expect(screen.getByText(tr('financial.recon.manual.f.supplier'))).toBeTruthy()
    rerender(<NewTransactionPane binding={baseBinding({ type: 'FeePenaltyInterest' })} />)
    expect(screen.queryByText(tr('financial.recon.manual.f.supplier'))).toBeNull()
    expect(screen.getByText(tr('financial.recon.manual.f.category'))).toBeTruthy()
  })

  it('Fornecedor e Programa são selects REAIS (dispara setSupplierRef/setProgramRef)', () => {
    const setSupplierRef = vi.fn()
    const setProgramRef = vi.fn()
    render(
      <NewTransactionPane
        binding={baseBinding({
          type: 'Payment',
          showPayeeBlock: true,
          partnerOptions: [{ value: 'p1', label: 'ACME · 12.345.678/0001-90' }],
          programOptions: [{ value: 'pr1', label: 'EDU — Educação' }],
          setSupplierRef,
          setProgramRef,
        })}
      />,
    )
    const supplier = screen.getByLabelText(tr('financial.recon.manual.f.supplier'))
    expect(supplier.hasAttribute('disabled')).toBe(false)
    fireEvent.change(supplier, { target: { value: 'p1' } })
    expect(setSupplierRef).toHaveBeenCalledWith('p1')

    const program = screen.getByLabelText(tr('financial.recon.manual.f.program'))
    fireEvent.change(program, { target: { value: 'pr1' } })
    expect(setProgramRef).toHaveBeenCalledWith('pr1')
  })

  it('Criar lançamento bloqueado quando não pode; habilitado e submete quando pode', () => {
    const submit = vi.fn()
    const { rerender } = render(<NewTransactionPane binding={baseBinding({ canSubmit: false })} />)
    expect(
      screen
        .getByRole('button', { name: (n) => n.includes(tr('financial.recon.manual.submitFull')) })
        .hasAttribute('disabled'),
    ).toBe(true)
    rerender(<NewTransactionPane binding={baseBinding({ type: 'Payment', canSubmit: true, submit })} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.manual.submitFull')) }),
    )
    expect(submit).toHaveBeenCalled()
  })
})
