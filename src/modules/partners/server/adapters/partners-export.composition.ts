/**
 * Composition root do export de parceiros. Env lido DENTRO da função (nunca em escopo de módulo).
 * Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base do `CORE_API_URL` (prefixo `/api/v2`).
 */
import type { Result } from '#shared/primitives/result.ts'
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import {
  exportPartnerCsv,
  exportCollaboratorHistoryCsv,
  type PartnerExportResource,
  type PartnerExportQuery,
  type PartnerExportFile,
} from './core-api/core-api-partners-export.ts'

export const exportPartner = (
  resource: PartnerExportResource,
  query: PartnerExportQuery,
  token: string,
): Promise<Result<PartnerExportFile, PartnersError>> =>
  exportPartnerCsv(coreApiBase(loadEnvOrThrow().CORE_API_URL, 'v1'), resource, query, token)

export const exportCollaboratorHistory = (
  id: string,
  token: string,
): Promise<Result<PartnerExportFile, PartnersError>> =>
  exportCollaboratorHistoryCsv(coreApiBase(loadEnvOrThrow().CORE_API_URL, 'v1'), id, token)
