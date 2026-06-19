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
  canSubmit: false,
  submitting: false,
  errorTag: null,
  setType: vi.fn(),
  setDescription: vi.fn(),
  setDestinationAccount: vi.fn(),
  setConsciousConfirm: vi.fn(),
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

  it('Transferência mostra aviso + conta de destino + confirmação consciente', () => {
    render(<NewTransactionPane binding={baseBinding({ type: 'Transfer', needsDestination: true })} />)
    expect(screen.getByText(tr('financial.recon.manual.warning'))).toBeTruthy()
    expect(screen.getByLabelText(tr('financial.recon.manual.destination'))).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.manual.confirm'))).toBeTruthy()
  })

  it('Registrar bloqueado quando não pode; habilitado e submete quando pode', () => {
    const submit = vi.fn()
    const { rerender } = render(<NewTransactionPane binding={baseBinding({ canSubmit: false })} />)
    expect(
      screen
        .getByRole('button', { name: (n) => n.includes(tr('financial.recon.manual.submit')) })
        .hasAttribute('disabled'),
    ).toBe(true)
    rerender(<NewTransactionPane binding={baseBinding({ type: 'Payment', canSubmit: true, submit })} />)
    fireEvent.click(
      screen.getByRole('button', { name: (n) => n.includes(tr('financial.recon.manual.submit')) }),
    )
    expect(submit).toHaveBeenCalled()
  })
})
