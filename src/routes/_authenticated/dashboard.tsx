/**
 * Rota protegida de exemplo (/dashboard) — filha do layout `_authenticated`, portanto guardada:
 * sem sessão, o beforeLoad do layout redireciona ao /login. Demonstra o guard (US2). View burra.
 */
import { createFileRoute } from '@tanstack/react-router'

import { vars } from '#shared/ui/tokens/index.ts'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  // Placeholder do guard (US2) até o dashboard real (core-api#112). Fonte da marca p/ não cair na serifa do body.
  return (
    <div style={{ fontFamily: vars.font.family.body, color: vars.color.text.secondary }}>
      <p>Área protegida — só acessível com sessão válida.</p>
    </div>
  )
}
