/**
 * Instância da FinancierRepository — wire das server functions reais (import direto de server/adapters,
 * a fronteira que client-data pode tocar — boundary §I/§III). Espelha `supplier.repository.instance.ts`.
 */
import { listFinanciersFn } from '#modules/partners/server/adapters/server-fns/financier/list-financiers.query.fn.ts'
import { getFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/get-financier.query.fn.ts'
import { createFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/create-financier.service.fn.ts'
import { updateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/update-financier.service.fn.ts'
import { deactivateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/deactivate-financier.service.fn.ts'
import { reactivateFinancierFn } from '#modules/partners/server/adapters/server-fns/financier/reactivate-financier.service.fn.ts'

import { createFinancierRepository } from './financier.repository.ts'

export const financierRepository = createFinancierRepository({
  listFinanciersFn: (opts) => listFinanciersFn(opts),
  getFinancierFn: (opts) => getFinancierFn(opts),
  createFinancierFn: (opts) => createFinancierFn(opts),
  updateFinancierFn: (opts) => updateFinancierFn(opts),
  deactivateFinancierFn: (opts) => deactivateFinancierFn(opts),
  reactivateFinancierFn: (opts) => reactivateFinancierFn(opts),
})
