import { createFileRoute, redirect } from '@tanstack/react-router'

import { ReconciliationWorkspacePage } from '#modules/financial/client/reconciliation-workspace/page/reconciliation-workspace.page.tsx'

// Conciliação Bancária — TELA 2 (workspace de uma conta). Guard por `reconciliation:read`. O `$accountId`
// é o `debitAccountRef` (placeholder de teste até #168 — D2). Sem a permissão → volta ao dashboard.
export const Route = createFileRoute('/_authenticated/financeiro/conciliacao/$accountId')({
  beforeLoad: ({ context }) => {
    if (!context.user.permissions.includes('reconciliation:read')) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { accountId } = Route.useParams()
  return <ReconciliationWorkspacePage accountRef={accountId} />
}
