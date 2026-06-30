/**
 * Rota /parceiros/atos/criar — cadastro de ACT (US2).
 */
import { createFileRoute } from '@tanstack/react-router'
import * as z from 'zod'

import { ActCreatePage } from '#modules/partners/client/act-create/page/act-create.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/atos/criar')({
  validateSearch: z.object({ returnTo: z.string().trim().optional() }),
  component: ActCreatePage,
})
