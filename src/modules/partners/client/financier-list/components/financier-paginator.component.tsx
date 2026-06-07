import type { ReactNode } from 'react'

import { paginator, label, button } from './financier-paginator.css.ts'

export type FinancierPaginatorProps = Readonly<{
  page: number
  totalPages: number
  labels: Readonly<{ previous: string; next: string; page: string }>
  onPrev: () => void
  onNext: () => void
}>

export function FinancierPaginator(props: FinancierPaginatorProps): ReactNode {
  return (
    <nav className={paginator} aria-label={props.labels.page}>
      <button type="button" className={button} disabled={props.page <= 1} onClick={props.onPrev}>
        {props.labels.previous}
      </button>
      <span className={label}>
        {props.labels.page} {props.page} / {props.totalPages}
      </span>
      <button
        type="button"
        className={button}
        disabled={props.page >= props.totalPages}
        onClick={props.onNext}
      >
        {props.labels.next}
      </button>
    </nav>
  )
}
