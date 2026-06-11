/**
 * Rota /usuarios/$id — detalhe do Usuário (protegida). Stub: slice de detalhe/edição a seguir.
 */
import { createFileRoute } from '@tanstack/react-router'

import { UsersDetailPage } from '#modules/users/client/users-detail/page/users-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/usuarios/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <UsersDetailPage userId={id} />
}
