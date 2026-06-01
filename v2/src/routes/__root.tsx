/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'

// Contexto do router: o queryClient é injetado por getRouter() e fica tipado nos loaders.
interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // A <meta property="csp-nonce"> NÃO é emitida aqui de propósito: o próprio HeadContent a injeta
  // automaticamente (uma vez) quando o router tem `ssr.nonce` — setado por getRouter() per-request.
  // O cliente do Start lê essa meta (querySelector) p/ reconstruir o nonce na hidratação.
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ERP Bem Comum' },
    ],
    // Favicon explícito → o browser usa este ícone e PARA de pedir /favicon.ico (some o 404).
    // Reusa o logo da marca (same-origin, coberto por img-src 'self' na CSP). PNG: suporte universal.
    links: [{ rel: 'icon', type: 'image/png', href: '/images/logo-bem-comum.png' }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
