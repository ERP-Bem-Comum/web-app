import { CategorizationComponent } from '@/components/layout/financeiro/CategorizationComponent'
import { RecurrencyComponent } from '@/components/layout/financeiro/RecurrencyComponent'
import { ReceivableExtraInfoField } from './ReceivableExtraInfoField'
import { ReceivableFiles } from './ReceivableFiles'
import { ReceivableFooter } from './ReceivableFooter'
import { ReceivableModals } from './ReceivableModals'
import { ReceivableReceiption } from './ReceivableReceiption'
import { ReceivableRoot } from './ReceivableRoot'
import { ReceivableFinancierInfo } from './ReceivableFinancierInfo'

export const ReceivableStructure = {
  Root: ReceivableRoot,
  Footer: ReceivableFooter,
  Categorization: CategorizationComponent,
  ExtraInfo: ReceivableExtraInfoField,
  ReceiptionData: ReceivableReceiption,
  ReceivableSubject: ReceivableFinancierInfo,
  Files: ReceivableFiles,
  Recurrence: RecurrencyComponent,
  Modals: ReceivableModals,
}
