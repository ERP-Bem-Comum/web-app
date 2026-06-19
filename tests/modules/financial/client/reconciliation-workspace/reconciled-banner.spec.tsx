/**
 * ReconciledBanner (Vitest/jsdom) — view burra (US5): desfazer conciliação. Habilitado só quando há
 * reconciliationId (sessão); senão anunciado/desabilitado. Recebe um binding mock por props.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { ReconciledBanner } from '#modules/financial/client/reconciliation-workspace/components/reconciled-banner.component.tsx'
import type { UndoBinding } from '#modules/financial/client/reconciliation-workspace/undo.binding.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const baseUndo = (over: Partial<UndoBinding> = {}): UndoBinding => ({
  reason: '',
  undoing: false,
  errorTag: null,
  setReason: vi.fn(),
  undo: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('ReconciledBanner', () => {
  it('com id da sessão, Desfazer habilitado e dispara undo(recId, txId)', () => {
    const undo = vi.fn()
    render(<ReconciledBanner undo={baseUndo({ undo })} reconciliationId="r1" transactionId="t1" />)
    const btn = screen.getByRole('button', { name: tr('financial.recon.undo.button') })
    expect(btn.hasAttribute('disabled')).toBe(false)
    fireEvent.click(btn)
    expect(undo).toHaveBeenCalledWith('r1', 't1')
  })

  it('sem id (pós-reload), Desfazer desabilitado + nota honesta', () => {
    render(<ReconciledBanner undo={baseUndo()} reconciliationId={null} transactionId="t1" />)
    expect(screen.getByText(tr('financial.recon.undo.unavailable'))).toBeTruthy()
    expect(
      screen.getByRole('button', { name: tr('financial.recon.undo.button') }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
