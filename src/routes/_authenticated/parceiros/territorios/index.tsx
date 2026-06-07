/**
 * Rota /parceiros/territorios — geografia de parceria (estados e municípios). Protegida.
 */
import { createFileRoute } from '@tanstack/react-router'

import { GeographyPage } from '#modules/partners/client/geography/page/geography.page.tsx'

export const Route = createFileRoute('/_authenticated/parceiros/territorios/')({
  component: GeographyPage,
})
