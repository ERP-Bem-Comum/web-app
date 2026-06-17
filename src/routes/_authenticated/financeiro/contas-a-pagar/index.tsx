import { createFileRoute, redirect } from '@tanstack/react-router'

import { ContasAPagarPage } from '#modules/financial/client/contas-a-pagar-list/page/contas-a-pagar.page.tsx'

// Grid de Contas a Pagar — tela de entrada do submódulo. Guard de rota por `fiscal-document:read`
// (defesa em profundidade; o menu também é gated). Sem a permissão → volta ao dashboard.
export const Route = createFileRoute('/_authenticated/financeiro/contas-a-pagar/')({
  beforeLoad: ({ context }) => {
    if (!context.user.permissions.includes('fiscal-document:read')) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ContasAPagarPage,
})
