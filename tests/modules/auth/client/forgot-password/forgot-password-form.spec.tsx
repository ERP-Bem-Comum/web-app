/**
 * ForgotPasswordForm + ForgotPasswordSuccessModal (Vitest/jsdom) — views BURRAS. Comportamento via props:
 * envio, cancelar, e o modal de sucesso (anti-enumeração: mensagem uniforme + "Entendi").
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import {
  ForgotPasswordForm,
  type ForgotPasswordFormProps,
} from '#modules/auth/client/forgot-password/components/forms/forgot-password-form.component.tsx'
import { ForgotPasswordSuccessModal } from '#modules/auth/client/forgot-password/components/success-modal.component.tsx'

// <dialog> + showModal()/close() não existem no jsdom — polyfill local mínimo (no-ops que refletem
// `.open`), suficiente p/ o useEffect do modal montar sem lançar. Mesmo padrão do partners-success-dialog.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement): void {
      this.open = true
    }
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement): void {
      this.open = false
    }
  }
})

afterEach(() => {
  cleanup()
})

const baseProps = (over: Partial<ForgotPasswordFormProps> = {}): ForgotPasswordFormProps => ({
  title: 'Recuperar Senha',
  subtitle: 'Informe seu e-mail.',
  emailLabel: 'E-mail',
  emailPlaceholder: 'seu@email.com',
  submitLabel: 'Enviar link para meu e-mail',
  cancelLabel: 'Cancelar',
  loadingLabel: 'Carregando…',
  email: '',
  submitting: false,
  errorText: null,
  errorReference: null,
  onEmailChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  ...over,
})

describe('ForgotPasswordForm (view burra)', () => {
  it('renderiza logo, título e o botão de envio', () => {
    render(<ForgotPasswordForm {...baseProps()} />)
    expect(screen.getByRole('img')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Recuperar Senha' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /enviar link/i })).toBeTruthy()
  })

  it('campo E-mail com label associado + placeholder', () => {
    render(<ForgotPasswordForm {...baseProps()} />)
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeTruthy()
  })

  it('encaminha onEmailChange e onSubmit', () => {
    const onEmailChange = vi.fn()
    const onSubmit = vi.fn()
    render(<ForgotPasswordForm {...baseProps({ onEmailChange, onSubmit })} />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'a@b.com' } })
    expect(onEmailChange).toHaveBeenCalledWith('a@b.com')
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('"Cancelar" dispara onCancel (volta ao login)', () => {
    const onCancel = vi.fn()
    render(<ForgotPasswordForm {...baseProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('erro de conectividade → alerta (role="alert"); NÃO diferencia e-mail inexistente', () => {
    render(<ForgotPasswordForm {...baseProps({ errorText: 'Serviço temporariamente indisponível.' })} />)
    expect(screen.getByRole('alert').textContent).toContain('Serviço temporariamente indisponível.')
  })
})

describe('ForgotPasswordSuccessModal (anti-enumeração)', () => {
  it('open=false → o <dialog> não está aberto', () => {
    render(
      <ForgotPasswordSuccessModal
        open={false}
        title="Verifique seu e-mail"
        message="Se esse email estiver cadastrado no sistema, enviaremos um link."
        confirmLabel="Entendi"
        onConfirm={vi.fn()}
      />,
    )
    const dialog = document.querySelector('dialog')
    expect(dialog?.open ?? false).toBe(false)
  })

  it('open=true → mostra a mensagem uniforme e "Entendi" dispara onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ForgotPasswordSuccessModal
        open={true}
        title="Verifique seu e-mail"
        message="Se esse email estiver cadastrado no sistema, enviaremos um link."
        confirmLabel="Entendi"
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText(/Se esse email estiver cadastrado/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
