import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

// Design system (side-effects de registro, 1×): tema aplica os tokens no :root e as
// webfonts self-host registram seus @font-face. Devem rodar no boot, antes do render.
import '#shared/ui/tokens/theme.css.ts'
import '#shared/ui/tokens/fonts.ts'

import { getRequestCspNonce } from '#external/http/csp-nonce.ts'
import { createAppQueryClient } from './query-client.ts'
import { routeTree } from './routeTree.gen'

// O plugin tanstackStart() espera este named export `getRouter`,
// que deve retornar uma NOVA instância a cada chamada (SSR-safe).
export function getRouter() {
  // Dependência circular (queryClient precisa do router p/ navigate; router precisa do
  // queryClient no context): resolvida por referência tardia a uma função `() => void`.
  // onAuthExpired só é chamado em runtime, quando o router já existe.
  let onAuthExpired: () => void = () => undefined

  const queryClient = createAppQueryClient(() => {
    onAuthExpired()
  })

  // Nonce CSP per-request (servidor): casa com o header Content-Security-Policy e libera o <script>
  // inline de bootstrap do Start. No cliente é undefined — o Start o reconstrói da <meta csp-nonce>.
  const nonce = getRequestCspNonce()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    ssr: { nonce },
  })

  // 401/auth:expired → manda ao login preservando o destino atual (FR-006). safeRedirect na volta.
  onAuthExpired = () => {
    void router.navigate({ to: '/login', search: { redirect: router.state.location.href } })
  }

  // Dehydrate/hydrate + streaming + redirect handling automáticos; injeta QueryClientProvider.
  // Fonte: handbook/reference/tanstack-router/integrations/query.md
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
