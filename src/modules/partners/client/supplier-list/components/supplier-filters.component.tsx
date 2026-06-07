import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './supplier-filters.controller.ts'
import { toolbar, search, group, select, chip, chipActive } from './supplier-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

export type SupplierFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  category: string
  categories: readonly string[]
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
    category: string
  }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onCategory: (category: string) => void
}>

const STATUSES: readonly StatusFilter[] = ['all', 'active', 'inactive']

export function SupplierFilters(props: SupplierFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  return (
    <div className={toolbar}>
      <div className={search}>
        <Input
          id="supplier-search"
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

      <select
        className={select}
        aria-label={props.labels.category}
        value={props.category}
        onChange={(e) => {
          props.onCategory(e.target.value)
        }}
      >
        <option value="">{props.labels.category}</option>
        {props.categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  )
}
