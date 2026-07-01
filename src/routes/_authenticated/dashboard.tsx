/**
 * Rota protegida /dashboard — filha do layout `_authenticated` (guardada: sem sessão, o beforeLoad do
 * layout redireciona ao /login). Delega à `DashboardPage` do financial (042 — widget "Últimos pagamentos").
 * View burra: a rota só monta a página.
 */
import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '#modules/financial/client/dashboard/page/dashboard.page.tsx'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})
