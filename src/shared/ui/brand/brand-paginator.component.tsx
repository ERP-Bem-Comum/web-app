/**
 * BrandPaginator — footer/paginação reutilizável (identidade "brand"). View burra: recebe página/total e
 * dispara callbacks. "Itens por página" (5/10/25) à esquerda; pager à direita.
 */
import type { ReactNode } from 'react'

import { paginator, label, button, pager, perPageWrap, perPageSelect } from './brand-paginator.css.ts'

const PER_PAGE_OPTIONS = [5, 10, 25] as const

export type BrandPaginatorLabels = Readonly<{
  previous: string
  next: string
  page: string
  of: string
  perPage: string
}>

export type BrandPaginatorProps = Readonly<{
  page: number
  totalPages: number
  perPage: number
  labels: BrandPaginatorLabels
  onPrev: () => void
  onNext: () => void
  onPerPage: (perPage: number) => void
}>

export function BrandPaginator(props: BrandPaginatorProps): ReactNode {
  return (
    <nav className={paginator} aria-label={props.labels.page}>
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
      <span className={pager}>
        <button type="button" className={button} disabled={props.page <= 1} onClick={props.onPrev}>
          {props.labels.previous}
        </button>
        <span className={label}>
          {props.labels.page} {props.page} {props.labels.of} {props.totalPages}
        </span>
        <button
          type="button"
          className={button}
          disabled={props.page >= props.totalPages}
          onClick={props.onNext}
        >
          {props.labels.next}
        </button>
      </span>
    </nav>
  )
}
