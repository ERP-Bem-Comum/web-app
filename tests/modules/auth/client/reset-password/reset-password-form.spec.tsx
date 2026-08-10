/**
 * ResetPasswordForm + ResetPasswordInvalidLink + ResetPasswordSuccessModal (Vitest/jsdom) — views BURRAS
 * do "Redefinir Senha" (#038). Comportamento via props: gating do botão, checklist, alerta de erro único
 * (400 "link inválido"), estado sem-form (token ausente) e o modal de sucesso.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import {
  ResetPasswordForm,
  type ResetPasswordFormProps,
  type ResetPasswordRule,
} from '#modules/auth/client/reset-password/components/forms/reset-password-form.component.tsx'
import { ResetPasswordInvalidLink } from '#modules/auth/client/reset-password/components/invalid-link.component.tsx'
import { ResetPasswordSuccessModal } from '#modules/auth/client/reset-password/components/success-modal.component.tsx'

// <dialog> + showModal()/close() não existem no jsdom — polyfill local mínimo (reflete `.open`),
// suficiente p/ o useEffect do modal montar sem lançar. Mesmo padrão do forgot-password.
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

const allOkRules: readonly ResetPasswordRule[] = [
  { key: 'length', label: 'No mínimo 12 e no máximo 128 caracteres', ok: true },
  { key: 'upper', label: 'Uma letra maiúscula', ok: true },
  { key: 'lower', label: 'Uma letra minúscula', ok: true },
  { key: 'number', label: 'Um número', ok: true },
  { key: 'special', label: 'Um símbolo especial como @ ^ ~ #', ok: true },
]

const baseProps = (over: Partial<ResetPasswordFormProps> = {}): ResetPasswordFormProps => ({
  title: 'Redefinir Senha',
  subtitle: 'Escolha uma nova senha para a sua conta.',
  newLabel: 'Nova senha',
  confirmLabel: 'Confirmar nova senha',
  submitLabel: 'Redefinir senha',
  backLabel: 'Voltar ao login',
  loadingLabel: 'Carregando…',
  requirementsLabel: 'Sua senha precisa de:',
  mismatchLabel: 'As senhas não coincidem.',
  toggleVisibilityLabel: 'Mostrar ou ocultar a senha',
  next: '',
  confirm: '',
  showNext: false,
  showConfirm: false,
  rules: allOkRules,
  showMismatch: false,
  canSubmit: false,
  submitting: false,
  errorText: null,
  errorReference: null,
  onNextChange: vi.fn(),
  onConfirmChange: vi.fn(),
  onToggleNext: vi.fn(),
  onToggleConfirm: vi.fn(),
  onSubmit: vi.fn(),
  onBack: vi.fn(),
  ...over,
})

describe('ResetPasswordForm (view burra)', () => {
  it('renderiza título, dois campos de senha e a checklist', () => {
    render(<ResetPasswordForm {...baseProps()} />)
    expect(screen.getByRole('heading', { name: 'Redefinir Senha' })).toBeTruthy()
    expect(screen.getByLabelText('Nova senha')).toBeTruthy()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeTruthy()
    expect(screen.getByText('Sua senha precisa de:')).toBeTruthy()
    expect(screen.getByText('Uma letra maiúscula')).toBeTruthy()
  })

  it('botão DESABILITADO quando canSubmit=false (policy/confirm não satisfeitos)', () => {
    render(<ResetPasswordForm {...baseProps({ canSubmit: false })} />)
    const btn = screen.getByRole('button', { name: 'Redefinir senha' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('botão HABILITADO e onSubmit disparado quando canSubmit=true', () => {
    const onSubmit = vi.fn()
    render(<ResetPasswordForm {...baseProps({ canSubmit: true, onSubmit })} />)
    const btn = screen.getByRole('button', { name: 'Redefinir senha' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalled()
  })

  it('mostra "As senhas não coincidem." quando showMismatch=true', () => {
    render(<ResetPasswordForm {...baseProps({ showMismatch: true })} />)
    expect(screen.getByText('As senhas não coincidem.')).toBeTruthy()
  })

  it('erro 400 → mensagem única de "link inválido" em role="alert" (não diferencia o subcaso)', () => {
    render(
      <ResetPasswordForm
        {...baseProps({ errorText: 'Este link é inválido ou expirou. Solicite um novo.' })}
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('Este link é inválido ou expirou')
  })

  it('encaminha onNextChange / onConfirmChange', () => {
    const onNextChange = vi.fn()
    const onConfirmChange = vi.fn()
    render(<ResetPasswordForm {...baseProps({ onNextChange, onConfirmChange })} />)
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'y' } })
    expect(onNextChange).toHaveBeenCalledWith('x')
    expect(onConfirmChange).toHaveBeenCalledWith('y')
  })

  it('"Voltar ao login" dispara onBack', () => {
    const onBack = vi.fn()
    render(<ResetPasswordForm {...baseProps({ onBack })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao login' }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('ResetPasswordInvalidLink (token ausente → sem form)', () => {
  it('mostra a mensagem e o CTA para pedir novo link; NÃO renderiza campos de senha', () => {
    const onCta = vi.fn()
    render(
      <ResetPasswordInvalidLink
        title="Link inválido"
        message="Este link é inválido ou expirou. Solicite um novo."
        ctaLabel="Solicitar novo link"
        onCta={onCta}
      />,
    )
    expect(screen.getByText(/inválido ou expirou/i)).toBeTruthy()
    expect(screen.queryByLabelText('Nova senha')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar novo link' }))
    expect(onCta).toHaveBeenCalled()
  })
})

describe('ResetPasswordSuccessModal (sucesso 2xx)', () => {
  it('open=false → o <dialog> não está aberto', () => {
    render(
      <ResetPasswordSuccessModal
        open={false}
        title="Senha redefinida com sucesso!"
        message="Sua senha foi redefinida."
        confirmLabel="Ir para o login"
        onConfirm={vi.fn()}
      />,
    )
    const dialog = document.querySelector('dialog')
    expect(dialog?.open ?? false).toBe(false)
  })

  it('open=true → mostra o sucesso e "Ir para o login" dispara onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ResetPasswordSuccessModal
        open={true}
        title="Senha redefinida com sucesso!"
        message="Sua senha foi redefinida."
        confirmLabel="Ir para o login"
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText(/Senha redefinida com sucesso/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o login' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
