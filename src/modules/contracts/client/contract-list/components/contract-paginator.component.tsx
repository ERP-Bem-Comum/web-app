/**
 * ContractPaginator — componente BURRO (§XI, ADR-0009): paginador da lista de contratos.
 * Apresentação pura (props → JSX). Zero estado/fetch.
 */
import type { ReactNode } from 'react'

import {
  container,
  rangeInfo,
  separator,
  select,
  perPageLabel,
  navGroup,
  navButton,
} from './contract-paginator.css.ts'

export type ContractPaginatorProps = Readonly<{
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (limit: number) => void
}>

const PAGE_SIZE_OPTIONS = [5, 10, 12, 25, 50] as const

export function ContractPaginator(props: ContractPaginatorProps): ReactNode {
  const start = props.totalItems === 0 ? 0 : (props.page - 1) * props.itemsPerPage + 1
  const end = Math.min(props.page * props.itemsPerPage, props.totalItems)

  const canGoPrev = props.page > 1
  const canGoNext = props.page < props.totalPages

  return (
    <div className={container}>
      <span className={rangeInfo}>
        {start}–{end} de {props.totalItems}
      </span>

      <span className={separator} aria-hidden="true">
        ·
      </span>

      {props.onItemsPerPageChange !== undefined ? (
        <>
          <select
            className={select}
            value={props.itemsPerPage}
            onChange={(e) => {
              props.onItemsPerPageChange?.(Number(e.target.value))
            }}
            aria-label="Itens por página"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className={perPageLabel}>por página</span>
        </>
      ) : null}

      <div className={navGroup}>
        <button
          type="button"
          className={navButton}
          onClick={() => {
            props.onPageChange(props.page - 1)
          }}
          disabled={!canGoPrev}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <button
          type="button"
          className={navButton}
          onClick={() => {
            props.onPageChange(props.page + 1)
          }}
          disabled={!canGoNext}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  )
}
