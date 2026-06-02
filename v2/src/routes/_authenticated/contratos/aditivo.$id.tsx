import { createFileRoute } from '@tanstack/react-router'
import { AmendmentCreatePage } from '#modules/contracts/client/amendment-create/page/amendment-create.page.tsx'

function AmendmentCreateRoute(): JSX.Element {
  const { id } = Route.useParams()
  return <AmendmentCreatePage contractId={id} />
}

export const Route = createFileRoute('/_authenticated/contratos/aditivo/$id')({
  component: AmendmentCreateRoute,
})
