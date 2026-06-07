/**
 * Composition root do export de parceiros. Env lido DENTRO da função (nunca em escopo de módulo).
 * Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do `CORE_API_URL` (prefixo `/api/v2`).
 */
import type { Result } from '#shared/primitives/result.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import {
  exportPartnerCsv,
  type PartnerExportResource,
  type PartnerExportQuery,
  type PartnerExportFile,
} from './core-api/core-api-partners-export.ts'

const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

export const exportPartner = (
  resource: PartnerExportResource,
  query: PartnerExportQuery,
  token: string,
): Promise<Result<PartnerExportFile, PartnersError>> =>
  exportPartnerCsv(derivePartnersBase(loadEnvOrThrow().CORE_API_URL), resource, query, token)
