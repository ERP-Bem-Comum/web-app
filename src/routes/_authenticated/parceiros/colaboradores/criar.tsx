/**
 * Rota /parceiros/colaboradores/criar — inclusão de colaborador (feature 018).
 */
import { createFileRoute } from '@tanstack/react-router'

import { CollaboratorCreatePage } from '#modules/partners/client/collaborator-create/page/collaborator-create.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/colaboradores/criar')({
  component: CollaboratorCreatePage,
})
