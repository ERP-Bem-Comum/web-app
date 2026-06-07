/**
 * Composition root do server/supplier. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do `CORE_API_URL` (prefixo `/api/v2`).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
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

const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiSuppliersClient(derivePartnersBase(env.CORE_API_URL))
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
