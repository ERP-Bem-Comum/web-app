/**
 * ForgotPasswordPage — template/composição (§XI, ADR-0009): liga o binding + Controller + View burra +
 * modal de sucesso. Reaproveita o SHELL visual do login (mesmo módulo, só-tokens): fundo com formas,
 * card branco sobre a barra laranja.
 *
 * Anti-enumeração: o modal de sucesso abre SEMPRE que a chamada COMPLETA (`succeeded`), com mensagem
 * UNIFORME — nunca revela se o e-mail existe. "Entendi" e "Cancelar" voltam ao login.
 */
import type { ReactNode } from 'react'

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
import { useForgotPasswordBinding } from '../bind/forgot-password.binding.ts'
import { useForgotPasswordFormController } from '../components/forms/forgot-password-form.controller.ts'
import { ForgotPasswordForm } from '../components/forms/forgot-password-form.component.tsx'
import { ForgotPasswordSuccessModal } from '../components/success-modal.component.tsx'

const t = createTranslator(ptBR)

export function ForgotPasswordPage(): ReactNode {
  const { forgotPasswordCommand } = useForgotPasswordBinding()
  const form = useForgotPasswordFormController(
    forgotPasswordCommand.execute,
    forgotPasswordCommand.resetError,
  )

  return (
    <div className={screen}>
      <div className={shapeTopRight} aria-hidden="true" />
      <div className={shapeBottomLeft} aria-hidden="true" />

      <div className={cardWrapper}>
        <div className={accentBar} aria-hidden="true" />
        <div className={cardContent}>
          <ForgotPasswordForm
            title={t('auth.forgot.title')}
            subtitle={t('auth.forgot.subtitle')}
            emailLabel={t('auth.forgot.email-label')}
            emailPlaceholder={t('auth.forgot.email-placeholder')}
            submitLabel={t('auth.forgot.submit')}
            cancelLabel={t('auth.forgot.cancel')}
            loadingLabel={t('common.loading')}
            email={form.email}
            submitting={forgotPasswordCommand.running}
            errorText={forgotPasswordCommand.errorTag === null ? null : t(forgotPasswordCommand.errorTag)}
            errorReference={
              forgotPasswordCommand.errorReference === null
                ? null
                : `${t('auth.error.reference-label')} ${forgotPasswordCommand.errorReference}`
            }
            onEmailChange={form.setEmail}
            onSubmit={form.submit}
            onCancel={forgotPasswordCommand.backToLogin}
          />
        </div>
      </div>

      <ForgotPasswordSuccessModal
        open={forgotPasswordCommand.succeeded}
        title={t('auth.forgot.success-title')}
        message={t('auth.forgot.success-body')}
        confirmLabel={t('auth.forgot.understood')}
        onConfirm={forgotPasswordCommand.backToLogin}
      />
    </div>
  )
}
