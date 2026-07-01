/**
 * Ativação de Conta (#039) — cobertura do modo `variant='activate'` (Vitest/jsdom). A tela é a MESMA do
 * reset (#038); só o texto e o destino do CTA mudam. Aqui verificamos a COSTURA real da variant: o
 * seletor de copy (`setPasswordCopy`) resolve as chaves → o catálogo PT resolve o texto → as views
 * BURRAS renderizam a copy de ativação, com o MESMO gating de botão do reset. Sem provider de
 * router/query: exercemos as views com as strings que a page passaria no modo activate.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  setPasswordCopy,
  setPasswordErrorKey,
} from '#modules/auth/client/reset-password/page/set-password.copy.ts'
import {
  ResetPasswordForm,
  type ResetPasswordFormProps,
  type ResetPasswordRule,
} from '#modules/auth/client/reset-password/components/forms/reset-password-form.component.tsx'
import { ResetPasswordInvalidLink } from '#modules/auth/client/reset-password/components/invalid-link.component.tsx'
import { ResetPasswordSuccessModal } from '#modules/auth/client/reset-password/components/success-modal.component.tsx'

// <dialog> polyfill mínimo (jsdom não implementa showModal/close). Mesmo padrão das outras specs de auth.
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

const t = (k: string): string => ptBR[k] ?? k
const copy = setPasswordCopy('activate')

const allOkRules: readonly ResetPasswordRule[] = [
  { key: 'length', label: 'No mínimo 12 e no máximo 128 caracteres', ok: true },
  { key: 'upper', label: 'Uma letra maiúscula', ok: true },
  { key: 'lower', label: 'Uma letra minúscula', ok: true },
  { key: 'number', label: 'Um número', ok: true },
  { key: 'special', label: 'Um símbolo especial como @ ^ ~ #', ok: true },
]

// Props como a ResetPasswordPage montaria no modo activate: título/subtítulo/submit vêm da copy da
// variant; labels de campo e checklist reusam auth.reset.* (compartilhados).
const activateFormProps = (over: Partial<ResetPasswordFormProps> = {}): ResetPasswordFormProps => ({
  title: t(copy.titleKey),
  subtitle: t(copy.subtitleKey),
  newLabel: t('auth.reset.new-label'),
  confirmLabel: t('auth.reset.confirm-label'),
  submitLabel: t(copy.submitKey),
  backLabel: t('auth.reset.back-to-login'),
  loadingLabel: t('common.loading'),
  requirementsLabel: t('auth.reset.requirements'),
  mismatchLabel: t('auth.reset.mismatch'),
  toggleVisibilityLabel: t('auth.reset.toggle-visibility'),
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

describe('Activate — form com a copy de ativação', () => {
  it('renderiza "Criar Senha", subtítulo de boas-vindas e o botão "Criar senha"', () => {
    render(<ResetPasswordForm {...activateFormProps()} />)
    expect(screen.getByRole('heading', { name: 'Criar Senha' })).toBeTruthy()
    expect(screen.getByText('Boas-vindas! Defina uma senha para acessar o sistema.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Criar senha' })).toBeTruthy()
  })

  it('mesmo gating do reset: botão DESABILITADO com canSubmit=false', () => {
    render(<ResetPasswordForm {...activateFormProps({ canSubmit: false })} />)
    const btn = screen.getByRole('button', { name: 'Criar senha' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('mesmo gating do reset: botão HABILITADO e onSubmit disparado com canSubmit=true', () => {
    const onSubmit = vi.fn()
    render(<ResetPasswordForm {...activateFormProps({ canSubmit: true, onSubmit })} />)
    const btn = screen.getByRole('button', { name: 'Criar senha' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalled()
  })

  it('erro 400 → mensagem de convite inválido (texto da variant, não do reset)', () => {
    const key = setPasswordErrorKey('activate', 'auth.reset.error.link-invalid')
    render(<ResetPasswordForm {...activateFormProps({ errorText: t(key) })} />)
    expect(screen.getByRole('alert').textContent).toContain('Este convite é inválido ou expirou.')
  })
})

describe('Activate — estado sem token (convite inválido) → CTA para o login', () => {
  it('mostra "Convite inválido", a orientação e o CTA "Ir para o login"; sem campos de senha', () => {
    const onCta = vi.fn()
    render(
      <ResetPasswordInvalidLink
        title={t(copy.invalidTitleKey)}
        message={t(copy.invalidBodyKey)}
        ctaLabel={t(copy.invalidCtaKey)}
        onCta={onCta}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Convite inválido' })).toBeTruthy()
    expect(screen.getByText(/Peça um novo ao administrador/i)).toBeTruthy()
    expect(screen.queryByLabelText('Nova senha')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o login' }))
    expect(onCta).toHaveBeenCalled()
  })
})

describe('Activate — modal de sucesso "Conta ativada!"', () => {
  it('open=true → mostra "Conta ativada!" e "Ir para o login" dispara onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <ResetPasswordSuccessModal
        open={true}
        title={t(copy.successTitleKey)}
        message={t(copy.successBodyKey)}
        confirmLabel={t(copy.successCtaKey)}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText(/Conta ativada!/i)).toBeTruthy()
    expect(screen.getByText(/Você já pode entrar no sistema/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o login' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
