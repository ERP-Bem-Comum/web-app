import { createFileRoute } from '@tanstack/react-router'

import { LancarDocumentoPage } from '#modules/financial/client/document-create/page/lancar-documento.page.tsx'

export const Route = createFileRoute('/_authenticated/financeiro/contas-a-pagar/lancar')({
  // `?id=<uuid>` → modo edição ("Editar pagamento" do drawer). Ausente → modo criação.
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === 'string' && search.id !== '' ? search.id : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useSearch()
  return <LancarDocumentoPage documentId={id} />
}
