import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './financier-filters.controller.ts'
import { toolbar, search, group, chip, chipActive } from './financier-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

export type FinancierFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
  }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
}>

const STATUSES: readonly StatusFilter[] = ['all', 'active', 'inactive']

export function FinancierFilters(props: FinancierFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  return (
    <div className={toolbar}>
      <div className={search}>
        <Input
          id="financier-search"
          value={searchField.value}
          placeholder={props.labels.search}
          onChange={searchField.setValue}
        />
      </div>

      <div className={group} role="group" aria-label={props.labels.all}>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={props.status === s ? chipActive : chip}
            aria-pressed={props.status === s}
            onClick={() => {
              props.onStatus(s)
            }}
          >
            {props.labels[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
