/**
 * DueDateModal (Vitest/jsdom) — modal de "Alterar vencimento" (view burra). Cobre: input de data dispara
 * onChange; Aplicar dispara onApply; aviso de bloqueados quando há selecionados não-Aberto.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DueDateModal } from '#modules/financial/client/contas-a-pagar-list/components/due-date-modal.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

describe('DueDateModal', () => {
  it('open=false não renderiza', () => {
    const { container } = render(
      <DueDateModal
        open={false}
        count={1}
        blockedCount={0}
        value=""
        running={false}
        onChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(container.textContent).toBe('')
  })

  it('data dispara onChange; Aplicar dispara onApply', () => {
    const onChange = vi.fn()
    const onApply = vi.fn()
    render(
      <DueDateModal
        open
        count={2}
        blockedCount={0}
        value="2026-07-10"
        running={false}
        onChange={onChange}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(tr('financial.list.dueDate.modalTitle')), {
      target: { value: '2026-08-15' },
    })
    expect(onChange).toHaveBeenCalledWith('2026-08-15')
    fireEvent.click(screen.getByText(tr('financial.list.dueDate.modalApply')))
    expect(onApply).toHaveBeenCalled()
  })

  it('Aplicar desabilitado sem data', () => {
    render(
      <DueDateModal
        open
        count={1}
        blockedCount={0}
        value=""
        running={false}
        onChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect((screen.getByText(tr('financial.list.dueDate.modalApply')) as HTMLButtonElement).disabled).toBe(
      true,
    )
  })

  it('mostra aviso de bloqueados quando blockedCount > 0', () => {
    render(
      <DueDateModal
        open
        count={1}
        blockedCount={2}
        value="2026-07-10"
        running={false}
        onChange={vi.fn()}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.list.dueDate.modalBlocked'))).toBeTruthy()
  })
})
