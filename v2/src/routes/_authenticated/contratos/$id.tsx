import { createFileRoute } from '@tanstack/react-router'
import { ContractDetailPage } from '#modules/contracts/client/contract-detail/page/contract-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/$id')({
  component: () => {
    const { id } = Route.useParams()
    return <ContractDetailPage contractId={id} />
  },
})
