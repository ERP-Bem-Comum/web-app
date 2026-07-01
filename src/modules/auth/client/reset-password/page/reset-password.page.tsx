/**
 * ResetPasswordPage — template/composição (§XI, ADR-0009): liga o binding + Controller + Views burras +
 * modal de sucesso do fluxo "Redefinir Senha" (#038). Reaproveita o SHELL visual do login (só-tokens):
 * fundo com formas, card branco sobre a barra laranja.
 *
 * Estados: (a) `token` ausente/vazio → ResetPasswordInvalidLink (sem form) → "Recuperar Senha";
 * (b) sucesso (2xx) → ResetPasswordSuccessModal → login; (c) erro 400 → mensagem única "link inválido"
 * dentro do form; rede/5xx → mensagem genérica. O `token` vem da ROTA (search param) por prop.
 */
import type { ReactNode } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  screen,
  shapeTopRight,
  shapeBottomLeft,
  cardWrapper,
  accentBar,
  cardContent,
} from '#modules/auth/client/login/page/login.css.ts'
import { evaluatePassword, PASSWORD_RULE_KEYS } from '#modules/users/public-api/index.ts'
import { useResetPasswordBinding } from '../bind/reset-password.binding.ts'
import { useResetPasswordFormController } from '../components/forms/reset-password-form.controller.ts'
import { resetPasswordViewModel } from '../viewModel/reset-password.view-model.ts'
import {
  ResetPasswordForm,
  type ResetPasswordRule,
} from '../components/forms/reset-password-form.component.tsx'
import { ResetPasswordInvalidLink } from '../components/invalid-link.component.tsx'
import { ResetPasswordSuccessModal } from '../components/success-modal.component.tsx'

const t = createTranslator(ptBR)

export type ResetPasswordPageProps = Readonly<{ token: string | null }>

function ResetPasswordShell(props: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <div className={screen}>
      <div className={shapeTopRight} aria-hidden="true" />
      <div className={shapeBottomLeft} aria-hidden="true" />
      <div className={cardWrapper}>
        <div className={accentBar} aria-hidden="true" />
        <div className={cardContent}>{props.children}</div>
      </div>
    </div>
  )
}

export function ResetPasswordPage(props: ResetPasswordPageProps): ReactNode {
  const navigate = useNavigate()
  const goToForgot = (): void => {
    void navigate({ to: '/recuperar-senha' })
  }

  // Sem token no link → estado inválido (sem form). Nunca renderiza o formulário.
  if (props.token === null || props.token.trim() === '') {
    return (
      <ResetPasswordShell>
        <ResetPasswordInvalidLink
          title={t('auth.reset.invalid-link-title')}
          message={t('auth.reset.invalid-link-body')}
          ctaLabel={t('auth.reset.invalid-link-cta')}
          onCta={goToForgot}
        />
      </ResetPasswordShell>
    )
  }

  return <ResetPasswordFormBody token={props.token} onGoToForgot={goToForgot} />
}

// Corpo com token válido: separado para os hooks só rodarem quando há form (regra dos hooks).
function ResetPasswordFormBody(props: Readonly<{ token: string; onGoToForgot: () => void }>): ReactNode {
  const { resetPasswordCommand, passwordLimits } = useResetPasswordBinding()
  const form = useResetPasswordFormController(
    props.token,
    resetPasswordCommand.execute,
    resetPasswordCommand.resetError,
  )

  const checks = evaluatePassword(form.next, passwordLimits)
  const ruleLabel: Readonly<Record<(typeof PASSWORD_RULE_KEYS)[number], string>> = {
    length: t('auth.reset.rule.length')
      .replace('{{min}}', String(passwordLimits.minLength))
      .replace('{{max}}', String(passwordLimits.maxLength)),
    upper: t('auth.reset.rule.upper'),
    lower: t('auth.reset.rule.lower'),
    number: t('auth.reset.rule.number'),
    special: t('auth.reset.rule.special'),
  }
  const rules: readonly ResetPasswordRule[] = PASSWORD_RULE_KEYS.map((key) => ({
    key,
    label: ruleLabel[key],
    ok: checks[key],
  }))

  const showMismatch = form.confirm !== '' && form.confirm !== form.next
  const canSubmit =
    resetPasswordViewModel.canSubmit(form.next, form.confirm, passwordLimits) && !resetPasswordCommand.running

  return (
    <ResetPasswordShell>
      <ResetPasswordForm
        title={t('auth.reset.title')}
        subtitle={t('auth.reset.subtitle')}
        newLabel={t('auth.reset.new-label')}
        confirmLabel={t('auth.reset.confirm-label')}
        submitLabel={t('auth.reset.submit')}
        backLabel={t('auth.reset.back-to-login')}
        loadingLabel={t('common.loading')}
        requirementsLabel={t('auth.reset.requirements')}
        mismatchLabel={t('auth.reset.mismatch')}
        toggleVisibilityLabel={t('auth.reset.toggle-visibility')}
        next={form.next}
        confirm={form.confirm}
        showNext={form.showNext}
        showConfirm={form.showConfirm}
        rules={rules}
        showMismatch={showMismatch}
        canSubmit={canSubmit}
        submitting={resetPasswordCommand.running}
        errorText={resetPasswordCommand.errorTag === null ? null : t(resetPasswordCommand.errorTag)}
        errorReference={
          resetPasswordCommand.errorReference === null
            ? null
            : `${t('auth.error.reference-label')} ${resetPasswordCommand.errorReference}`
        }
        onNextChange={form.setNext}
        onConfirmChange={form.setConfirm}
        onToggleNext={form.toggleShowNext}
        onToggleConfirm={form.toggleShowConfirm}
        onSubmit={form.submit}
        onBack={resetPasswordCommand.backToLogin}
      />

      <ResetPasswordSuccessModal
        open={resetPasswordCommand.succeeded}
        title={t('auth.reset.success-title')}
        message={t('auth.reset.success-body')}
        confirmLabel={t('auth.reset.success-cta')}
        onConfirm={resetPasswordCommand.backToLogin}
      />
    </ResetPasswordShell>
  )
}
