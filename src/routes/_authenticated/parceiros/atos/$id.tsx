/**
 * Rota /parceiros/atos/$id — detalhe de ACT + ações de ativação (US3).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ActDetailPage } from '#modules/partners/client/act-detail/page/act-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/atos/$id')({
  component: ActDetailPage,
})
