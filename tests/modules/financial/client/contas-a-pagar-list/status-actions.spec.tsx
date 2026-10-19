/**
 * StatusActions — layout por grupos (refino da spec 119) — vitest/jsdom.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  StatusActions,
  type StatusActionsProps,
} from '#modules/financial/client/contas-a-pagar-list/components/status-actions.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const props = (over: Partial<StatusActionsProps> = {}): StatusActionsProps => ({
  summary: '1 documento • Pago',
  canApprove: false,
  canReopen: false,
  canDelete: false,
  canPay: false,
  canUndoPayment: true,
  canUndoTransmission: false,
  running: false,
  onApprove: vi.fn(),
  onReopen: vi.fn(),
  onDelete: vi.fn(),
  onPay: vi.fn(),
  onUndoPayment: vi.fn(),
  onUndoTransmission: vi.fn(),
  ...over,
})

const button = (labelKey: string): HTMLButtonElement => {
  const b = screen.getByText(tr(labelKey)).closest('button')
  if (b === null) throw new Error(`botão não encontrado: ${labelKey}`)
  return b
}

describe('StatusActions — grupos (spec 119)', () => {
  it('três grupos nomeados, na ordem do ciclo do título', () => {
    render(<StatusActions {...props()} />)
    // `hidden`: o menu vive num <details> fechado, que o jsdom tira da árvore de acessibilidade.
    const groups = screen
      .getAllByRole('group', { hidden: true })
      .map((g) => g.getAttribute('aria-label'))
      // O próprio <details> tem papel implícito "group", sem nome — fica de fora.
      .filter((label) => label !== null)
    expect(groups).toEqual([
      tr('financial.list.status.group.approval'),
      tr('financial.list.status.group.payment'),
      tr('financial.list.status.group.correction'),
    ])
  })

  it('item habilitado age; desativado fica desativado e diz o porquê', () => {
    const p = props()
    render(<StatusActions {...p} />)
    fireEvent.click(button('financial.list.undo.payment.action'))
    expect(p.onUndoPayment).toHaveBeenCalledOnce()

    const transmission = button('financial.list.undo.transmission.action')
    expect(transmission.disabled).toBe(true)
    expect(transmission.title).toBe(tr('financial.list.undo.transmission.needTransmitted'))
  })

  it('rodando → tudo desativado', () => {
    render(<StatusActions {...props({ running: true })} />)
    expect(button('financial.list.undo.payment.action').disabled).toBe(true)
  })
})
