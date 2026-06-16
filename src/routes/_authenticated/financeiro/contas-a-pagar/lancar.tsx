import { createFileRoute } from '@tanstack/react-router'

import { LancarDocumentoPage } from '#modules/financial/client/document-create/page/lancar-documento.page.tsx'

export const Route = createFileRoute('/_authenticated/financeiro/contas-a-pagar/lancar')({
  component: LancarDocumentoPage,
})
