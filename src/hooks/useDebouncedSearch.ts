import { debounce } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'

export function UseDebouncedSearch(search: string) {
  const [searchOnHold, setSearchOnHold] = useState(search)
  const debouncedSearch = useCallback(
    debounce((currentSearch: string) => {
      setSearchOnHold(currentSearch)
    }, 500),
    [],
  )

  useEffect(() => {
    debouncedSearch(search)
    return () => debouncedSearch.cancel()
  }, [search, debouncedSearch])

  return searchOnHold
}
