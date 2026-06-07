/**
 * Public API do módulo Shell — ÚNICO ponto de import externo (boundary §I). Expõe a TELA-raiz que a rota
 * `_authenticated` monta, e o SidebarContext (consumido por rotas filhas que alinham pela largura da sidebar).
 */
export { RootPage, type RootPageProps } from '#modules/shell/client/root/page/root.page.tsx'
export { useSidebarContext, type SidebarContextValue } from '#modules/shell/client/root/sidebar.context.ts'
export type { RootUser } from '#modules/shell/client/root/bind/root.binding.ts'
