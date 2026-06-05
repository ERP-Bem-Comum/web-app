import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ContractDetailPage } from '#modules/contracts/client/contract-detail/page/contract-detail.page.tsx'

function ContractDetailRoute(): ReactNode {
  const { id } = Route.useParams()
  return <ContractDetailPage contractId={id} />
}

export const Route = createFileRoute('/_authenticated/contratos/$id')({
  component: ContractDetailRoute,
})
