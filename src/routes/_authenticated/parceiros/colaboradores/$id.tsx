/**
 * Rota /parceiros/colaboradores/$id — detalhe do colaborador (pré-cadastro + cadastro completo) + edição.
 */
import { createFileRoute } from '@tanstack/react-router'

import { CollaboratorDetailPage } from '#modules/partners/client/collaborator-detail/page/collaborator-detail.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/colaboradores/$id')({
  component: CollaboratorDetailPage,
})
