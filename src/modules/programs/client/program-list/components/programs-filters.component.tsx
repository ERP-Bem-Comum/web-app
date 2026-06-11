import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './programs-filters.controller.ts'
import { toolbar, search } from './programs-filters.css.ts'

export type ProgramsFiltersProps = Readonly<{
  searchValue: string
  searchLabel: string
  onSearch: (value: string) => void
}>

export function ProgramsFilters(props: ProgramsFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  return (
    <div className={toolbar}>
      <div className={search}>
        <Input id="programs-search" value={searchField.value} placeholder={props.searchLabel} onChange={searchField.setValue} />
      </div>
    </div>
  )
}
