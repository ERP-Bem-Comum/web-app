/**
 * Instância da FinancialRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `users.repository.instance.ts`.
 */
import { listDocumentsFn } from '#modules/financial/server/adapters/server-fns/list-documents.query.fn.ts'
import { listPayableTitlesFn } from '#modules/financial/server/adapters/server-fns/list-payable-titles.query.fn.ts'
import { listAllPayableTitlesFn } from '#modules/financial/server/adapters/server-fns/list-all-payable-titles.query.fn.ts'
import { listPayableCountsFn } from '#modules/financial/server/adapters/server-fns/list-payable-counts.query.fn.ts'
import { generateRemittanceFn } from '#modules/financial/server/adapters/server-fns/generate-remittance.service.fn.ts'
import { previewRemittanceFn } from '#modules/financial/server/adapters/server-fns/preview-remittance.query.fn.ts'
import { getDocumentFn } from '#modules/financial/server/adapters/server-fns/get-document.query.fn.ts'
import { getDocumentSourceFileFn } from '#modules/financial/server/adapters/server-fns/get-document-source-file.query.fn.ts'
import { getDocumentTimelineFn } from '#modules/financial/server/adapters/server-fns/get-document-timeline.query.fn.ts'
import { createDocumentFn } from '#modules/financial/server/adapters/server-fns/create-document.service.fn.ts'
import { adjustDocumentFn } from '#modules/financial/server/adapters/server-fns/adjust-document.service.fn.ts'
import { approveDocumentFn } from '#modules/financial/server/adapters/server-fns/approve-document.service.fn.ts'
import { updatePayableDueDateFn } from '#modules/financial/server/adapters/server-fns/update-payable-due-date.service.fn.ts'
import { undoApprovalFn } from '#modules/financial/server/adapters/server-fns/undo-approval.service.fn.ts'
import { cancelDocumentFn } from '#modules/financial/server/adapters/server-fns/cancel-document.service.fn.ts'
import { registerManualPaymentFn } from '#modules/financial/server/adapters/server-fns/register-manual-payment.service.fn.ts'
import { recentPaymentsFn } from '#modules/financial/server/adapters/server-fns/recent-payments.query.fn.ts'
import { getDashboardStatisticsFn } from '#modules/financial/server/adapters/server-fns/get-dashboard-statistics.query.fn.ts'
import { dashboardRealizedFn } from '#modules/financial/server/adapters/server-fns/dashboard-realized.query.fn.ts'

import { createFinancialRepository } from './financial.repository.ts'

export const financialRepository = createFinancialRepository({
  listDocumentsFn: (opts) => listDocumentsFn(opts),
  listPayableTitlesFn: (opts) => listPayableTitlesFn(opts),
  payableCountsFn: (opts) => listPayableCountsFn(opts),
  listAllPayableTitlesFn: (opts) => listAllPayableTitlesFn(opts),
  previewRemittanceFn: (opts) => previewRemittanceFn(opts),
  generateRemittanceFn: (opts) => generateRemittanceFn(opts),
  getDocumentFn: (opts) => getDocumentFn(opts),
  getDocumentSourceFileFn: (opts) => getDocumentSourceFileFn(opts),
  getDocumentTimelineFn: (opts) => getDocumentTimelineFn(opts),
  createDocumentFn: (opts) => createDocumentFn(opts),
  adjustDocumentFn: (opts) => adjustDocumentFn(opts),
  approveDocumentFn: (opts) => approveDocumentFn(opts),
  updatePayableDueDateFn: (opts) => updatePayableDueDateFn(opts),
  undoApprovalFn: (opts) => undoApprovalFn(opts),
  cancelDocumentFn: (opts) => cancelDocumentFn(opts),
  registerManualPaymentFn: (opts) => registerManualPaymentFn(opts),
  recentPaymentsFn: () => recentPaymentsFn(),
  dashboardStatisticsFn: () => getDashboardStatisticsFn(),
  dashboardRealizedFn: (opts) => dashboardRealizedFn(opts),
})
