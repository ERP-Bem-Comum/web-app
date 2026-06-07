/**
 * Public API do módulo Partners — ÚNICO ponto de import externo (boundary §I).
 * Expõe as server functions (para rotas/client) e os tipos do Model. À medida que cada sub-domínio
 * (collaborators/suppliers/financiers/geography) ganhar UI, suas fns/bindings entram aqui.
 *
 * Hoje: ACT (4º tipo de parceiro) — server completo, ligado ao core-api `/api/v1/acts`.
 */
export { listActsFn } from '#modules/partners/server/adapters/server-fns/act/list-acts.query.fn.ts'
export { getActFn } from '#modules/partners/server/adapters/server-fns/act/get-act.query.fn.ts'
export { createActFn } from '#modules/partners/server/adapters/server-fns/act/create-act.service.fn.ts'
export { updateActFn } from '#modules/partners/server/adapters/server-fns/act/update-act.service.fn.ts'
export { deactivateActFn } from '#modules/partners/server/adapters/server-fns/act/deactivate-act.service.fn.ts'
export { reactivateActFn } from '#modules/partners/server/adapters/server-fns/act/reactivate-act.service.fn.ts'

export type { ActListItem, ActDetail, ActListResponse } from '#modules/partners/server/domain/act/act.io.ts'

// Export CSV (passthrough do core-api) — suppliers/collaborators/financiers/acts.
export { exportPartnersFn } from '#modules/partners/server/adapters/server-fns/export-partners.query.fn.ts'
export type { PartnerExportResource, PartnerExportFile } from '#modules/partners/server/adapters/core-api/core-api-partners-export.ts'
