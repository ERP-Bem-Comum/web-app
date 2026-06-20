import { createFileRoute, redirect } from '@tanstack/react-router'

import { ReconciliationAccountsPage } from '#modules/financial/client/reconciliation-accounts/page/reconciliation-accounts.page.tsx'

// Conciliação Bancária — TELA 1 (grid de contas). Guard por `reconciliation:read` (defesa em
// profundidade; o menu também é gated). Sem a permissão → volta ao dashboard. O grid real depende do
// core-api#168 (chrome honesto até lá).
export const Route = createFileRoute('/_authenticated/financeiro/conciliacao/')({
  beforeLoad: ({ context }) => {
    if (!context.user.permissions.includes('reconciliation:read')) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: ReconciliationAccountsPage,
})
