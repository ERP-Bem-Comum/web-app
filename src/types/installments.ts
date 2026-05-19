import { InstallmentStatus, InstallmentType } from '@/enums/installments'
import { postergateInstallmentsSchema } from '@/validators/installments'
import { z } from 'zod'

export type Installments = {
  id?: number
  installmentNumber: number
  value: number
  dueDate: Date
  type: InstallmentType
  status: InstallmentStatus
  totalInstallments: number
  receivableId: number | null
  payableId: number | null
  relatedLiquidInstallmentId: number | null
}

export type PairedDefaultValues = z.input<typeof postergateInstallmentsSchema>

export type outputPairedValues = z.infer<typeof postergateInstallmentsSchema>
