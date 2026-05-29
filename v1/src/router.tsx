import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export function getRouter() {
  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    context: { queryClient } as RouterContext,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

type MyRouter = ReturnType<typeof getRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: MyRouter
  }
}
