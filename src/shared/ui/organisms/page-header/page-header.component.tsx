import type { ReactNode } from 'react'

import { actions as actionsClass, header, subtitle as subtitleClass, title, titleGroup } from './page-header.css.ts'

/**
 * PageHeader (organismo) — BURRO: título (+subtítulo opcional) e um slot de ações por composição.
 * Sem lógica de negócio. `title`/`subtitle` chegam já traduzidos (i18n na feature). Estilo via tokens.
 */
export type PageHeaderProps = Readonly<{
  title: string
  subtitle?: string
  actions?: ReactNode
}>

export function PageHeader(props: PageHeaderProps): ReactNode {
  return (
    <header className={header}>
      <div className={titleGroup}>
        <h1 className={title}>{props.title}</h1>
        {props.subtitle !== undefined ? <p className={subtitleClass}>{props.subtitle}</p> : null}
      </div>
      {props.actions !== undefined ? <div className={actionsClass}>{props.actions}</div> : null}
    </header>
  )
}
