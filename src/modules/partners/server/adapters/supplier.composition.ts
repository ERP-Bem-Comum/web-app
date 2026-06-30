/**
 * Composition root do server/supplier. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Parceiros vivem em `/api/v1` (legado espelhado — ADR-0033); a base de versão vem de `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiSuppliersClient } from './core-api/core-api-suppliers.ts'
import {
  createListSuppliers,
  createGetSupplier,
  createCreateSupplier,
  createUpdateSupplier,
  createDeactivateSupplier,
  createReactivateSupplier,
  createListServiceCategories,
} from '#modules/partners/server/application/supplier/supplier.use-cases.ts'

type SupplierServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiSuppliersClient(coreApiBase(env.CORE_API_URL, 'v1'))
  return {
    listSuppliers: createListSuppliers({ client }),
    getSupplier: createGetSupplier({ client }),
    createSupplier: createCreateSupplier({ client }),
    updateSupplier: createUpdateSupplier({ client }),
    deactivateSupplier: createDeactivateSupplier({ client }),
    reactivateSupplier: createReactivateSupplier({ client }),
    listServiceCategories: createListServiceCategories({ client }),
  }
}

let cached: SupplierServer | undefined
export const supplierServer = (): SupplierServer => (cached ??= build())
