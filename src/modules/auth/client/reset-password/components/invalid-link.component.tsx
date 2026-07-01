/**
 * ResetPasswordInvalidLink — componente BURRO (§XI): estado "link inválido" do "Redefinir Senha" (#038).
 * Renderizado quando não há `token` no search (ou o backend rejeitou o link, 400) — sem formulário.
 * Só props (strings + callback) → JSX. Oferece voltar a "Recuperar Senha" para pedir um novo link.
 */
import type { ReactNode } from 'react'

import { Button, Logo } from '#shared/ui/index.ts'

import { content, header, title, titleUnderline, message, ctaWrap } from './invalid-link.css.ts'

export type ResetPasswordInvalidLinkProps = Readonly<{
  title: string
  message: string
  ctaLabel: string
  onCta: () => void
}>

export function ResetPasswordInvalidLink(props: ResetPasswordInvalidLinkProps): ReactNode {
  return (
    <div className={content}>
      <div className={header}>
        <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={56} />
        <h1 className={title}>{props.title}</h1>
        <span className={titleUnderline} aria-hidden="true" />
        <p className={message}>{props.message}</p>
      </div>

      <div className={ctaWrap}>
        <Button onClick={props.onCta}>{props.ctaLabel}</Button>
      </div>
    </div>
  )
}
