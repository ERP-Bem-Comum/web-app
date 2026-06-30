/**
 * Rota /minha-conta — autosserviço do próprio perfil (protegida). Sem search params.
 */
import { createFileRoute } from '@tanstack/react-router'

import { MyAccountPage } from '#modules/users/client/my-account/page/my-account.page.tsx'

export const Route = createFileRoute('/_authenticated/minha-conta/')({
  component: MyAccountPage,
})
