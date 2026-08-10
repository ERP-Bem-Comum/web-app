/**
 * ResetPasswordPage — template/composição (§XI, ADR-0009): liga o binding + Controller + Views burras +
 * modal de sucesso da tela de "definir senha". Serve DOIS fluxos IDÊNTICOS via `variant`:
 * 'reset' (Redefinir Senha #038) e 'activate' (Ativação de Conta #039). Só o TEXTO e o destino do CTA
 * de link inválido mudam (via `setPasswordCopy`); form/checklist/modal/binding/view-model/server-fn
 * são reusados iguais. Reaproveita o SHELL visual do login (só-tokens): fundo com formas, card branco.
 *
 * Estados: (a) `token` ausente/vazio → ResetPasswordInvalidLink (sem form) → CTA da variant;
 * (b) sucesso (2xx) → ResetPasswordSuccessModal → login; (c) erro 400 → mensagem única da variant
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
import { setPasswordCopy, setPasswordErrorKey, type SetPasswordVariant } from './set-password.copy.ts'

const t = createTranslator(ptBR)

export type ResetPasswordPageProps = Readonly<{
  token: string | null
  /** 'reset' (#038, default) ou 'activate' (#039). Só troca copy + destino do CTA de link inválido. */
  variant?: SetPasswordVariant
}>

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
  const variant: SetPasswordVariant = props.variant ?? 'reset'
  const copy = setPasswordCopy(variant)
  const navigate = useNavigate()
  const goToInvalidTarget = (): void => {
    void navigate({ to: copy.invalidTarget })
  }

  // Sem token no link → estado inválido (sem form). Nunca renderiza o formulário.
  if (props.token === null || props.token.trim() === '') {
    return (
      <ResetPasswordShell>
        <ResetPasswordInvalidLink
          title={t(copy.invalidTitleKey)}
          message={t(copy.invalidBodyKey)}
          ctaLabel={t(copy.invalidCtaKey)}
          onCta={goToInvalidTarget}
        />
      </ResetPasswordShell>
    )
  }

  return <ResetPasswordFormBody token={props.token} variant={variant} />
}

// Corpo com token válido: separado para os hooks só rodarem quando há form (regra dos hooks).
function ResetPasswordFormBody(props: Readonly<{ token: string; variant: SetPasswordVariant }>): ReactNode {
  const copy = setPasswordCopy(props.variant)
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
        title={t(copy.titleKey)}
        subtitle={t(copy.subtitleKey)}
        newLabel={t('auth.reset.new-label')}
        confirmLabel={t('auth.reset.confirm-label')}
        submitLabel={t(copy.submitKey)}
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
        errorText={
          resetPasswordCommand.errorTag === null
            ? null
            : t(setPasswordErrorKey(props.variant, resetPasswordCommand.errorTag))
        }
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
        title={t(copy.successTitleKey)}
        message={t(copy.successBodyKey)}
        confirmLabel={t(copy.successCtaKey)}
        onConfirm={resetPasswordCommand.backToLogin}
      />
    </ResetPasswordShell>
  )
}
