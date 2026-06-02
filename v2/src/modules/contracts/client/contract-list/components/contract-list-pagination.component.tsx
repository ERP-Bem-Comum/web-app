import type { ReactNode } from 'react'
import type { ListContractsResponse } from '#modules/contracts/client/data/model/contracts.model.ts'

interface Props {
  meta: ListContractsResponse['meta']
}

export function ContractListPagination({ meta }: Props): ReactNode {
  return (
    <div>
      Página {meta.page} de {meta.totalPages} · Total: {meta.total}
    </div>
  )
}
