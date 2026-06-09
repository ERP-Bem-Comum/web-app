import type { ReactNode } from 'react'

import { paginator, label, button, perPageWrap, perPageSelect } from './act-paginator.css.ts'

const PER_PAGE_OPTIONS = [5, 10, 25] as const

export type ActPaginatorProps = Readonly<{
  page: number
  totalPages: number
  perPage: number
  labels: Readonly<{ previous: string; next: string; page: string; perPage: string }>
  onPrev: () => void
  onNext: () => void
  onPerPage: (perPage: number) => void
}>

export function ActPaginator(props: ActPaginatorProps): ReactNode {
  return (
    <nav className={paginator} aria-label={props.labels.page}>
      <span className={perPageWrap}>
        {props.labels.perPage}
        <select
          className={perPageSelect}
          aria-label={props.labels.perPage}
          value={props.perPage}
          onChange={(e) => { props.onPerPage(Number(e.target.value)); }}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </span>
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
