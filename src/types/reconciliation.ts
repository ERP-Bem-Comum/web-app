import { BankReconciliationType } from '@/enums/reconciliation'
import { categorizationSchema, requiredCategorizationSchema } from '@/validators/categorization'
import { createBankRecordApischema, filterDateSchema } from '@/validators/reconciliation'
import { z } from 'zod'

export type ReconciliationRadioValue = 'find' | 'transfer'

export type FilterDateType = z.infer<typeof filterDateSchema>

export type CreatebankRecordApi = z.input<typeof createBankRecordApischema>

type bankRecordApiOutput = z.output<typeof createBankRecordApischema>

type optionalCategorization = { categorization?: z.infer<typeof categorizationSchema> }

type bankRecordApi = Omit<bankRecordApiOutput, 'categorization'>

export type CreatebankRecordApiOutput = bankRecordApi & optionalCategorization

export type CreateBankReconciliation = {
  accountId: number
  type: BankReconciliationType
  recordSystemId?: number
  transferedById?: number
}

export interface TransactionCardProps {
  id?: number
  documentNumber: string
  date: string
  amount: number
  title: string
  description: string
  beneficiary?: string
  className?: string
  categorization?: z.input<typeof requiredCategorizationSchema>
}
