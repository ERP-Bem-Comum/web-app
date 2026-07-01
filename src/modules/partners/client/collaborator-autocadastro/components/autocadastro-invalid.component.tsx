/**
 * AutocadastroInvalid — componente BURRO (§XI): estado "convite inválido/expirado" do Autocadastro (#040).
 * Renderizado quando não há `token` no search OU o preview retornou 'autocadastro-invalid' (404,
 * anti-enumeração) — sem formulário. Só props (strings) → JSX. Não oferece CTA de "novo link" (reenviar
 * convite é ação do admin/backend, fora de escopo #040) — apenas orienta a procurar a ABC.
 */
import type { ReactNode } from 'react'

import { Logo } from '#shared/ui/index.ts'

import { content, header, title, titleUnderline, message } from './autocadastro-invalid.css.ts'

export type AutocadastroInvalidProps = Readonly<{
  title: string
  message: string
}>

export function AutocadastroInvalid(props: AutocadastroInvalidProps): ReactNode {
  return (
    <div className={content}>
      <div className={header}>
        <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={56} />
        <h1 className={title}>{props.title}</h1>
        <span className={titleUnderline} aria-hidden="true" />
        <p className={message}>{props.message}</p>
      </div>
    </div>
  )
}
