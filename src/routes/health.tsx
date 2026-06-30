import { createFileRoute } from '@tanstack/react-router'

// Health do FRONT (FR-002): confirma que router + SSR + runtime estão no ar.
// Não depende do backend. View burra (§XI): só renderiza o payload estático.
const HEALTH = { status: 'ok' } as const

export const Route = createFileRoute('/health')({
  component: Health,
})

function Health() {
  return <pre>{JSON.stringify(HEALTH)}</pre>
}
