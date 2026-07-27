/**
 * Instância da ReportsRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III: o client só chama a server fn, nunca `server/domain`/`application`). Espelha
 * `financial.repository.instance.ts`.
 */
import { getTeamReportFn } from '#modules/reports/server/adapters/server-fns/get-team-report.query.fn.ts'
import { getTeamDemographicsFn } from '#modules/reports/server/adapters/server-fns/get-team-demographics.query.fn.ts'
import { getSuppliersWithoutContractFn } from '#modules/reports/server/adapters/server-fns/get-suppliers-without-contract.query.fn.ts'
import { getPaymentPositionFn } from '#modules/reports/server/adapters/server-fns/get-payment-position.query.fn.ts'
import { getRealizedReportFn } from '#modules/reports/server/adapters/server-fns/get-realized-report.query.fn.ts'

import { createReportsRepository } from './reports.repository.ts'

export const reportsRepository = createReportsRepository({
  teamReportFn: () => getTeamReportFn(),
  teamDemographicsFn: () => getTeamDemographicsFn(),
  suppliersWithoutContractFn: () => getSuppliersWithoutContractFn(),
  paymentPositionFn: (filter) => getPaymentPositionFn({ data: filter }),
  realizedReportFn: (query) => getRealizedReportFn({ data: query }),
})
