import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main>
      <h1>ERP Bem Comum — v2</h1>
      <p>Fundação TanStack Start ativa (SSR).</p>
    </main>
  )
}
