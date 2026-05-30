/**
 * Public API do módulo Auth — ÚNICO ponto pelo qual rotas/outros módulos consomem a Auth (ADR-0004).
 * Expõe a server fn de sessão (p/ guards), o saneador de redirect e os tipos públicos. NÃO exporta
 * internals de server/domain|application (token/sessão ficam server-side).
 */
export { getCurrentUserFn } from '#modules/auth/server/adapters/server-fns/get-current-user.server-fn.ts'
export { safeRedirect } from '#modules/auth/client/data/helpers/safe-redirect.ts'
export { useCurrentUser } from '#modules/auth/client/view-model/current-user/use-current-user.view-model.ts'
export { logoutUseCase } from '#modules/auth/client/usecase/logout/logout.composition.ts'
export type { CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'
