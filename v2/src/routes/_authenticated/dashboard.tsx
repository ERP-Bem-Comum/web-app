/**
 * Rota protegida de exemplo (/dashboard) — filha do layout `_authenticated`, portanto guardada:
 * sem sessão, o beforeLoad do layout redireciona ao /login. Demonstra o guard (US2). View burra.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Área protegida — só acessível com sessão válida.</p>
    </main>
  )
}
