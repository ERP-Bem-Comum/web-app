/**
 * DeleteStatementModal (Vitest/jsdom) — modal de confirmação destrutivo (core-api#558): confirma/cancela a
 * exclusão do extrato e mostra o erro de guarda (409) sem fechar. View burra; recebe tudo por props.
 * A pergunta NOMEIA o extrato (conta + período), não as transações.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { DeleteStatementModal } from '#modules/financial/client/reconciliation-workspace/components/delete-statement-modal.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

const baseProps = (over: Record<string, unknown> = {}) => ({
  open: true,
  deleting: false,
  accountLabel: 'Demonstrativa PG · 237 Bradesco · Ag 1487 · CC 65732-4',
  periodLabel: '01/07/2026 – 31/07/2026',
  errorTag: null,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  ...over,
})

afterEach(() => {
  cleanup()
})

describe('DeleteStatementModal', () => {
  it('open=false → não renderiza', () => {
    render(<DeleteStatementModal {...baseProps({ open: false })} />)
    expect(screen.queryByText(tr('financial.recon.deleteStatement.title'))).toBeNull()
  })

  it('pergunta NOMEIA o extrato (conta + período) + aviso; dispara onConfirm/onCancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<DeleteStatementModal {...baseProps({ onConfirm, onCancel })} />)
    expect(screen.getByText(tr('financial.recon.deleteStatement.title'))).toBeTruthy()
    // A pergunta cita a conta e o período (composta com fragmentos i18n + os dados).
    expect(screen.getByText(/Demonstrativa PG/)).toBeTruthy()
    expect(screen.getByText(/01\/07\/2026 – 31\/07\/2026/)).toBeTruthy()
    expect(screen.getByText(tr('financial.recon.deleteStatement.message'))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.deleteStatement.confirm') }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: tr('financial.recon.deleteStatement.cancel') }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('sem conta/período → cai no fallback', () => {
    render(<DeleteStatementModal {...baseProps({ accountLabel: '', periodLabel: '' })} />)
    expect(screen.getByText(tr('financial.recon.deleteStatement.qFallback'))).toBeTruthy()
  })

  it('erro de guarda (409) aparece no modal', () => {
    render(
      <DeleteStatementModal
        {...baseProps({ errorTag: 'financial.recon.error.statement-has-reconciled-transactions' })}
      />,
    )
    expect(screen.getByText(tr('financial.recon.error.statement-has-reconciled-transactions'))).toBeTruthy()
  })

  it('deleting desabilita os botões (evita duplo clique)', () => {
    render(<DeleteStatementModal {...baseProps({ deleting: true })} />)
    expect(
      screen
        .getByRole('button', { name: tr('financial.recon.deleteStatement.confirm') })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})
