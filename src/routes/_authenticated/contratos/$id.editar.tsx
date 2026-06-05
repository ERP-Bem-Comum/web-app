import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ContractEditPage } from '#modules/contracts/client/contract-edit/page/contract-edit.page.tsx'

function ContractEditRoute(): ReactNode {
  const { id } = Route.useParams()
  return <ContractEditPage contractId={id} />
}

export const Route = createFileRoute('/_authenticated/contratos/$id/editar')({
  component: ContractEditRoute,
})
