/**
 * Composition root do server/reports. Monta os use-cases com o client real. Env lido DENTRO da função
 * (nunca em escopo de módulo). Relatórios vivem em `/api/v2/reports` (modelo novo, como financial —
 * ADR-0033). A base de versão vem do helper único `coreApiBase`. Espelha `financial.composition.ts`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiReportsClient } from './core-api/core-api-reports.ts'
import {
  createGetTeamReport,
  createGetTeamDemographics,
  createGetSuppliersWithoutContract,
  createGetPaymentPosition,
  createGetPaymentAnalysis,
  createGetRealizedReport,
  createGetCashflowReport,
} from '#modules/reports/server/application/reports.use-cases.ts'

type ReportsServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const base = coreApiBase(env.CORE_API_URL, 'v2')
  // Segunda base (`/financial`) só p/ o catálogo de Centros de Custo do fan-out do Fluxo (#590 não expõe CC como eixo).
  const client = createCoreApiReportsClient(`${base}/reports`, `${base}/financial`)
  return {
    getTeamReport: createGetTeamReport({ client }),
    getTeamDemographics: createGetTeamDemographics({ client }),
    getSuppliersWithoutContract: createGetSuppliersWithoutContract({ client }),
    getPaymentPosition: createGetPaymentPosition({ client }),
    getPaymentAnalysis: createGetPaymentAnalysis({ client }),
    getRealizedReport: createGetRealizedReport({ client }),
    getCashflowReport: createGetCashflowReport({ client }),
  }
}

let cached: ReportsServer | undefined
export const reportsServer = (): ReportsServer => (cached ??= build())
