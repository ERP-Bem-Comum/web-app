/**
 * Rota /parceiros/financiadores/$id — detalhe de financiador + ações de status (US3).
 */
import { createFileRoute } from '@tanstack/react-router'

import { FinancierDetailPage } from '#modules/partners/client/financier-detail/page/financier-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/financiadores/$id')({
  component: FinancierDetailPage,
})
