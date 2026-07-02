import type { ReactNode } from 'react'

import { paginator, perPageWrap, perPageSelect, range, button } from './plan-paginator.css.ts'

const PER_PAGE_OPTIONS = [5, 10, 25] as const

export type PlanPaginatorLabels = Readonly<{
  perPage: string
  previous: string
  next: string
  /** Template do intervalo "{from}-{to} de {total}" (i18n na page substitui os tokens). */
  rangeTemplate: string
}>

export type PlanPaginatorProps = Readonly<{
  page: number
  totalPages: number
  perPage: number
  total: number
  labels: PlanPaginatorLabels
  onPrev: () => void
  onNext: () => void
  onPerPage: (perPage: number) => void
}>

/** Rodapé de paginação (view BURRA): itens por página + intervalo + setas. */
export function PlanPaginator(props: PlanPaginatorProps): ReactNode {
  const from = props.total === 0 ? 0 : (props.page - 1) * props.perPage + 1
  const to = Math.min(props.total, props.page * props.perPage)
  const rangeText = props.labels.rangeTemplate
    .replace('{from}', String(from))
    .replace('{to}', String(to))
    .replace('{total}', String(props.total))

  return (
    <nav className={paginator} aria-label={props.labels.perPage}>
      <span className={perPageWrap}>
        {props.labels.perPage}
        <select
          className={perPageSelect}
          aria-label={props.labels.perPage}
          value={props.perPage}
          onChange={(e) => {
            props.onPerPage(Number(e.target.value))
          }}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </span>

      <span className={range}>{rangeText}</span>

      <button
        type="button"
        className={button}
        disabled={props.page <= 1}
        aria-label={props.labels.previous}
        onClick={props.onPrev}
      >
        ‹
      </button>
      <button
        type="button"
        className={button}
        disabled={props.page >= props.totalPages}
        aria-label={props.labels.next}
        onClick={props.onNext}
      >
        ›
      </button>
    </nav>
  )
}
