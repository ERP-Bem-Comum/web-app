/**
 * Rota /programas/$id — detalhe/edição de Programa (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ProgramDetailPage } from '#modules/programs/client/program-detail/page/program-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/programas/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <ProgramDetailPage programId={id} />
}
