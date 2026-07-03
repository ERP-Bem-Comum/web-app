/**
 * ConfirmActionModal + PlanFeedbackToast (Vitest/jsdom) — views burras: fechada com open=false; botão
 * destrutivo; campo "Nome" desabilita confirmar quando vazio; toast só renderiza com mensagem.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import {
  ConfirmActionModal,
  PlanFeedbackToast,
} from '#modules/budget-plans/client/planejamento/components/confirm-action-modal.component.tsx'

afterEach(() => {
  cleanup()
})

const baseProps = (over: Record<string, unknown> = {}) => ({
  open: true,
  title: 'Excluir Plano Orçamentário',
  message: "Atenção, você está prestes a excluir o plano 'X'.",
  confirmLabel: 'Excluir',
  cancelLabel: 'Cancelar',
  danger: true,
  onConfirm: vi.fn(),
  onClose: vi.fn(),
  ...over,
})

describe('ConfirmActionModal', () => {
  it('não renderiza quando open=false', () => {
    render(<ConfirmActionModal {...baseProps({ open: false })} />)
    expect(screen.queryByText('Excluir Plano Orçamentário')).toBeNull()
  })

  it('renderiza título, mensagem e encaminha onConfirm', () => {
    const onConfirm = vi.fn()
    render(<ConfirmActionModal {...baseProps({ onConfirm })} />)
    expect(screen.getByText('Excluir Plano Orçamentário')).toBeTruthy()
    fireEvent.click(screen.getByText('Excluir'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('campo Nome desabilita confirmar quando vazio', () => {
    render(
      <ConfirmActionModal
        {...baseProps({
          danger: false,
          confirmLabel: 'Criar Cenário',
          nameField: { label: 'Nome do cenário', value: '', onChange: vi.fn() },
        })}
      />,
    )
    const btn = screen.getByText('Criar Cenário')
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('campo Nome habilita confirmar quando preenchido', () => {
    render(
      <ConfirmActionModal
        {...baseProps({
          danger: false,
          confirmLabel: 'Criar Cenário',
          nameField: { label: 'Nome do cenário', value: 'Cenário A', onChange: vi.fn() },
        })}
      />,
    )
    expect(screen.getByText('Criar Cenário').hasAttribute('disabled')).toBe(false)
  })
})

describe('PlanFeedbackToast', () => {
  it('não renderiza sem mensagem', () => {
    render(<PlanFeedbackToast message={null} />)
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('renderiza a mensagem de sucesso', () => {
    render(<PlanFeedbackToast message="Plano excluído com sucesso!" />)
    expect(screen.getByRole('status').textContent).toContain('Plano excluído com sucesso!')
  })
})
