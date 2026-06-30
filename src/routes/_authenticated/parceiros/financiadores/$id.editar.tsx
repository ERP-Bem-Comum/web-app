/**
 * Rota /parceiros/financiadores/$id/editar — edição de financiador (US4).
 */
import { createFileRoute } from '@tanstack/react-router'

import { FinancierEditPage } from '#modules/partners/client/financier-edit/page/financier-edit.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/financiadores/$id/editar')({
  component: FinancierEditPage,
})
