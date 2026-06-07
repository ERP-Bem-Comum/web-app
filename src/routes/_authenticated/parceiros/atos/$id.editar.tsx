/**
 * Rota /parceiros/atos/$id/editar — edição de ACT (US4).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ActEditPage } from '#modules/partners/client/act-edit/page/act-edit.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/atos/$id/editar')({
  component: ActEditPage,
})
