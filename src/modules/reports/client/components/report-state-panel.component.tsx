/**
 * ReportStatePanel — view BURRA do estado transitório dos relatórios religados ao core-api (#114): loading e
 * erro. Renderiza um cartão único centralizado dentro do `screen` full-bleed (mesma casca das telas). Recebe
 * só os textos já resolvidos (i18n na page); ZERO derivação/data aqui. O empty-state honesto (dado real vazio)
 * NÃO passa por aqui — vive dentro de cada view (tabela/árvore com `empty`).
 */
import type { ReactNode } from 'react'

import { screen } from '#shared/ui/brand/brand-page.css.ts'

import { panel, title, hint } from './report-state-panel.css.ts'

export type ReportStatePanelProps = Readonly<{
  title: string
  /** 2ª linha opcional (ex.: a tag i18n do erro). */
  hint?: string
  /** Papel ARIA: 'status' (loading, aria-live polite) ou 'alert' (erro). */
  role?: 'status' | 'alert'
}>

export function ReportStatePanel(props: ReportStatePanelProps): ReactNode {
  return (
    <div className={screen}>
      <div className={panel} role={props.role ?? 'status'}>
        <p className={title}>{props.title}</p>
        {props.hint !== undefined && <p className={hint}>{props.hint}</p>}
      </div>
    </div>
  )
}
