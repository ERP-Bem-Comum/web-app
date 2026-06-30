/**
 * Rota /programas/criar — inclusão de Programa (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'

import { ProgramCreatePage } from '#modules/programs/client/program-create/page/program-create.page.tsx'

export const Route = createFileRoute('/_authenticated/programas/criar')({
  component: ProgramCreatePage,
})
