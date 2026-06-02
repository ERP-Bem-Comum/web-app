import { createFileRoute } from '@tanstack/react-router'
import { AmendmentCreatePage } from '#modules/contracts/client/amendment-create/page/amendment-create.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/aditivo/$id')({
  component: () => {
    const { id } = Route.useParams()
    return <AmendmentCreatePage contractId={id} />
  },
})
