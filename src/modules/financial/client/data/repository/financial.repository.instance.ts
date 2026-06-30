/**
 * Instância da FinancialRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `users.repository.instance.ts`.
 */
import { listDocumentsFn } from '#modules/financial/server/adapters/server-fns/list-documents.query.fn.ts'
import { listPayableTitlesFn } from '#modules/financial/server/adapters/server-fns/list-payable-titles.query.fn.ts'
import { getDocumentFn } from '#modules/financial/server/adapters/server-fns/get-document.query.fn.ts'
import { createDocumentFn } from '#modules/financial/server/adapters/server-fns/create-document.service.fn.ts'
import { adjustDocumentFn } from '#modules/financial/server/adapters/server-fns/adjust-document.service.fn.ts'
import { approveDocumentFn } from '#modules/financial/server/adapters/server-fns/approve-document.service.fn.ts'
import { undoApprovalFn } from '#modules/financial/server/adapters/server-fns/undo-approval.service.fn.ts'
import { cancelDocumentFn } from '#modules/financial/server/adapters/server-fns/cancel-document.service.fn.ts'
import { registerManualPaymentFn } from '#modules/financial/server/adapters/server-fns/register-manual-payment.service.fn.ts'

import { createFinancialRepository } from './financial.repository.ts'

export const financialRepository = createFinancialRepository({
  listDocumentsFn: (opts) => listDocumentsFn(opts),
  listPayableTitlesFn: (opts) => listPayableTitlesFn(opts),
  getDocumentFn: (opts) => getDocumentFn(opts),
  createDocumentFn: (opts) => createDocumentFn(opts),
  adjustDocumentFn: (opts) => adjustDocumentFn(opts),
  approveDocumentFn: (opts) => approveDocumentFn(opts),
  undoApprovalFn: (opts) => undoApprovalFn(opts),
  cancelDocumentFn: (opts) => cancelDocumentFn(opts),
  registerManualPaymentFn: (opts) => registerManualPaymentFn(opts),
})
