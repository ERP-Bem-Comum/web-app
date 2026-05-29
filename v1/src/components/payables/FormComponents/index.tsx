import { CategorizationComponent } from '@/components/layout/financeiro/CategorizationComponent'
import { RecurrencyComponent } from '@/components/layout/financeiro/RecurrencyComponent'
import { PayableExtraInfoField } from './PayableExtraInfoField'
import { PayableFiles } from './PayableFiles'
import { PayableFooter } from './PayableFooter'
import { PayableModals } from './PayableModals'
import { PayablePayment } from './PayablePayment'
import { PayablePaymentSubject } from './PayablePaymentSubject'
import { PayableRoot } from './PayableRoot'

export const PayableStructure = {
  Root: PayableRoot,
  Footer: PayableFooter,
  Categorization: CategorizationComponent,
  ExtraInfo: PayableExtraInfoField,
  PaymentData: PayablePayment,
  PaymentSubject: PayablePaymentSubject,
  Files: PayableFiles,
  Recurrence: RecurrencyComponent,
  Modals: PayableModals,
}
