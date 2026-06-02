import { createFileRoute } from '@tanstack/react-router'
import { ContractEditPage } from '#modules/contracts/client/contract-edit/page/contract-edit.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/$id/editar')({
  component: () => {
    const { id } = Route.useParams()
    return <ContractEditPage contractId={id} />
  },
})
