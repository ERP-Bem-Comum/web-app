/**
 * Rota /parceiros/financiadores/criar — cadastro de financiador (US2).
 */
import { createFileRoute } from '@tanstack/react-router'
import * as z from 'zod'

import { FinancierCreatePage } from '#modules/partners/client/financier-create/page/financier-create.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/financiadores/criar')({
  validateSearch: z.object({ returnTo: z.string().trim().optional() }),
  component: FinancierCreatePage,
})
