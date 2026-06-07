/**
 * Composition root do server/geography. Monta os use-cases com o client real. Env lido DENTRO da função.
 * Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do `CORE_API_URL`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiGeographyClient } from './core-api/core-api-geography.ts'
import {
  createListPartnerStates,
  createTogglePartnerState,
  createListMunicipalitiesByUf,
  createTogglePartnerMunicipality,
} from '#modules/partners/server/application/geography/geography.use-cases.ts'

type GeographyServer = ReturnType<typeof build>

const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiGeographyClient(derivePartnersBase(env.CORE_API_URL))
  return {
    listPartnerStates: createListPartnerStates({ client }),
    togglePartnerState: createTogglePartnerState({ client }),
    listMunicipalitiesByUf: createListMunicipalitiesByUf({ client }),
    togglePartnerMunicipality: createTogglePartnerMunicipality({ client }),
  }
}

let cached: GeographyServer | undefined
export const geographyServer = (): GeographyServer => (cached ??= build())
