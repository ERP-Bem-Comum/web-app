/**
 * DeleteConfirmModal (Vitest/jsdom) — modal de confirmação de exclusão (view burra). Cobre: avisa sobre
 * a exclusão dos filhos; confirma/cancela via callbacks; some quando `open=false`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { DeleteConfirmModal } from '#modules/financial/client/contas-a-pagar-list/components/delete-confirm.component.tsx'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (k: string): string => ptBR[k] ?? k

afterEach(() => {
  cleanup()
})

describe('DeleteConfirmModal', () => {
  it('open=false não renderiza nada', () => {
    const { container } = render(
      <DeleteConfirmModal
        open={false}
        count={1}
        draftCount={0}
        running={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(container.textContent).toBe('')
  })

  it('avisa sobre a exclusão dos títulos-filho e confirma/cancela', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <DeleteConfirmModal
        open
        count={2}
        draftCount={0}
        running={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(screen.getByText(tr('financial.list.delete.warnChildren'))).toBeTruthy()
    fireEvent.click(screen.getByText(tr('financial.list.delete.confirm')))
    expect(onConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText(tr('financial.list.delete.cancel')))
    expect(onCancel).toHaveBeenCalled()
  })

  it('mostra aviso de rascunhos ignorados quando draftCount > 0', () => {
    render(
      <DeleteConfirmModal
        open
        count={1}
        draftCount={2}
        running={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText(tr('financial.list.delete.draftSkipped'))).toBeTruthy()
  })
})
