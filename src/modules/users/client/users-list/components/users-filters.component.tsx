import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './users-filters.controller.ts'
import { toolbar, toolbarRow, search, group, chip, chipActive } from './users-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

export type UsersFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  labels: Readonly<{ search: string; all: string; active: string; inactive: string }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
}>

const STATUSES: readonly StatusFilter[] = ['all', 'active', 'inactive']

export function UsersFilters(props: UsersFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  const L = props.labels

  return (
    <div className={toolbar}>
      <div className={toolbarRow}>
        <div className={search}>
          <Input id="users-search" value={searchField.value} placeholder={L.search} onChange={searchField.setValue} />
        </div>
        <div className={group} role="group" aria-label={L.all}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={props.status === s ? chipActive : chip}
              aria-pressed={props.status === s}
              onClick={() => { props.onStatus(s) }}
            >
              {L[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
