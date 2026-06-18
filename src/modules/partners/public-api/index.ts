/**
 * Public API do módulo Partners — ÚNICO ponto de import externo (boundary §I).
 * Expõe as server functions (para rotas/client) e os tipos do Model. À medida que cada sub-domínio
 * (collaborators/suppliers/financiers/geography) ganhar UI, suas fns/bindings entram aqui.
 *
 * Hoje: ACT (4º tipo de parceiro) — server completo, ligado ao core-api `/api/v1/acts`.
 */
// ── Fornecedores (US2) ──────────────────────────────────────────────────────
export { listSuppliersFn } from '#modules/partners/server/adapters/server-fns/supplier/list-suppliers.query.fn.ts'
export { getSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/get-supplier.query.fn.ts'
export { createSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/create-supplier.service.fn.ts'
export { updateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/update-supplier.service.fn.ts'
export { deactivateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/deactivate-supplier.service.fn.ts'
export { reactivateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/reactivate-supplier.service.fn.ts'
export { listServiceCategoriesFn } from '#modules/partners/server/adapters/server-fns/supplier/list-service-categories.query.fn.ts'
export type {
  SupplierListItem,
  SupplierDetail,
  SupplierListResponse,
} from '#modules/partners/server/domain/supplier/supplier.io.ts'

// ── Financiadores (US3) ─────────────────────────────────────────────────────
export { listFinanciersFn } from '#modules/partners/server/adapters/server-fns/financier/list-financiers.query.fn.ts'
export { getFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/get-financier.query.fn.ts'
export { createFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/create-financier.service.fn.ts'
export { updateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/update-financier.service.fn.ts'
export { deactivateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/deactivate-financier.service.fn.ts'
export { reactivateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/reactivate-financier.service.fn.ts'
export type {
  FinancierListItem,
  FinancierDetail,
  FinancierListResponse,
} from '#modules/partners/server/domain/financier/financier.io.ts'

// ── Colaboradores ───────────────────────────────────────────────────────────
export { listCollaboratorsFn } from '#modules/partners/server/adapters/server-fns/collaborator/list-collaborators.query.fn.ts'
export { getCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/get-collaborator.query.fn.ts'
export type {
  CollaboratorListItem,
  CollaboratorDetail,
  CollaboratorListResponse,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'

// ── Geografia: Estados (US4) + Municípios (US5) ─────────────────────────────
export { listPartnerStatesFn } from '#modules/partners/server/adapters/server-fns/geography/list-partner-states.query.fn.ts'
export { togglePartnerStateFn } from '#modules/partners/server/adapters/server-fns/geography/toggle-partner-state.service.fn.ts'
export { listMunicipalitiesByUfFn } from '#modules/partners/server/adapters/server-fns/geography/list-municipalities-by-uf.query.fn.ts'
export { togglePartnerMunicipalityFn } from '#modules/partners/server/adapters/server-fns/geography/toggle-partner-municipality.service.fn.ts'
export { listAddedMunicipalitiesFn } from '#modules/partners/server/adapters/server-fns/geography/list-added-municipalities.query.fn.ts'
export type {
  PartnerState,
  PartnerMunicipality,
} from '#modules/partners/server/domain/geography/geography.types.ts'

// ── ACT (US6) ───────────────────────────────────────────────────────────────
export { listActsFn } from '#modules/partners/server/adapters/server-fns/act/list-acts.query.fn.ts'
export { getActFn } from '#modules/partners/server/adapters/server-fns/act/get-act.query.fn.ts'
export { createActFn } from '#modules/partners/server/adapters/server-fns/act/create-act.service.fn.ts'
export { updateActFn } from '#modules/partners/server/adapters/server-fns/act/update-act.service.fn.ts'
export { deactivateActFn } from '#modules/partners/server/adapters/server-fns/act/deactivate-act.service.fn.ts'
export { reactivateActFn } from '#modules/partners/server/adapters/server-fns/act/reactivate-act.service.fn.ts'

export type { ActListItem, ActDetail, ActListResponse } from '#modules/partners/server/domain/act/act.io.ts'

// Export CSV (passthrough do core-api) — suppliers/collaborators/financiers/acts.
export { exportPartnersFn } from '#modules/partners/server/adapters/server-fns/export-partners.query.fn.ts'
export { exportCollaboratorHistoryFn } from '#modules/partners/server/adapters/server-fns/collaborator/export-collaborator-history.query.fn.ts'
export type {
  PartnerExportResource,
  PartnerExportFile,
} from '#modules/partners/server/adapters/core-api/core-api-partners-export.ts'
