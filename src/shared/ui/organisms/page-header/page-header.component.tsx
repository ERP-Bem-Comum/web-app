import type { ReactNode } from 'react'

import {
  actions as actionsClass,
  backButton,
  header,
  leftGroup,
  subtitle as subtitleClass,
  title,
  titleGroup,
} from './page-header.css.ts'

// Chevron-esquerda inline (organismo não pode importar `icons` = shared-ui por boundaries; SVG puro
// herda a cor via currentColor). viewBox 0 0 24 24, igual aos demais ícones do DS.
function BackChevron(): ReactNode {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

/**
 * PageHeader (organismo) — BURRO: título (+subtítulo opcional), botão "voltar" opcional à esquerda e um
 * slot de ações por composição. Sem lógica de negócio. `title`/`subtitle`/`backLabel` chegam já
 * traduzidos (i18n na feature). Estilo via tokens.
 */
export type PageHeaderProps = Readonly<{
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Quando definido, mostra o botão voltar à esquerda do título e chama isto ao clicar. */
  onBack?: () => void
  /** Rótulo acessível do botão voltar (i18n na feature). Default: "Voltar". */
  backLabel?: string
}>

export function PageHeader(props: PageHeaderProps): ReactNode {
  return (
    <header className={header}>
      <div className={leftGroup}>
        {props.onBack !== undefined ? (
          <button
            type="button"
            className={backButton}
            onClick={props.onBack}
            aria-label={props.backLabel ?? 'Voltar'}
          >
            <BackChevron />
          </button>
        ) : null}
        <div className={titleGroup}>
          <h1 className={title}>{props.title}</h1>
          {props.subtitle !== undefined ? <p className={subtitleClass}>{props.subtitle}</p> : null}
        </div>
      </div>
      {props.actions !== undefined ? <div className={actionsClass}>{props.actions}</div> : null}
    </header>
  )
}
