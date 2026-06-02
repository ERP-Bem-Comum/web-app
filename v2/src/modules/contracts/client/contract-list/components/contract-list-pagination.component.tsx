import type { ReactNode } from 'react'

interface Props {
  page: number
  totalPages: number
  total: number
}

export function ContractListPagination({ page, totalPages, total }: Props): ReactNode {
  return (
    <div>
      Página {page} de {totalPages} · Total: {total}
    </div>
  )
}
