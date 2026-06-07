/**
 * Instância da SupplierRepository — wire das server functions reais (import direto de server/adapters,
 * a fronteira que client-data pode tocar — boundary §I/§III).
 */
import { listSuppliersFn } from '#modules/partners/server/adapters/server-fns/supplier/list-suppliers.query.fn.ts'
import { getSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/get-supplier.query.fn.ts'
import { createSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/create-supplier.service.fn.ts'
import { updateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/update-supplier.service.fn.ts'
import { deactivateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/deactivate-supplier.service.fn.ts'
import { reactivateSupplierFn } from '#modules/partners/server/adapters/server-fns/supplier/reactivate-supplier.service.fn.ts'
import { listServiceCategoriesFn } from '#modules/partners/server/adapters/server-fns/supplier/list-service-categories.query.fn.ts'

import { createSupplierRepository } from './supplier.repository.ts'

export const supplierRepository = createSupplierRepository({
  listSuppliersFn: (opts) => listSuppliersFn(opts),
  getSupplierFn: (opts) => getSupplierFn(opts),
  createSupplierFn: (opts) => createSupplierFn(opts),
  updateSupplierFn: (opts) => updateSupplierFn(opts),
  deactivateSupplierFn: (opts) => deactivateSupplierFn(opts),
  reactivateSupplierFn: (opts) => reactivateSupplierFn(opts),
  listServiceCategoriesFn: () => listServiceCategoriesFn(),
})
