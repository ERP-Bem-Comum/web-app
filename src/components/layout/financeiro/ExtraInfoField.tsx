import { RecurenceType } from '@/enums/payables'
import { handleDates } from '@/utils/dates'
import { getInstallmentInfo } from '@/utils/installments'
import { format } from 'date-fns'

interface ExtraInfoProps {
  totalValue: number
  recurrent: boolean
  recurrenceData:
    | {
        recurrenceType?: RecurenceType | null
        startDate?: Date | null
        endDate?: Date | null
        dueDay?: number | null
      }
    | undefined
    | null
  dueDate: Date | undefined | null
}

export const ExtraInfoField = ({
  totalValue,
  recurrent,
  recurrenceData,
  dueDate,
}: ExtraInfoProps) => {
  const installments = getInstallmentInfo({ recurrenceData, recurrent })

  const installmentsValue = () => {
    if (!recurrent || !recurrenceData) return totalValue

    if (Number.isNaN(totalValue) || installments.totalInstallments === 0) return 0

    return (totalValue / installments.totalInstallments).toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const getDueDate = () => {
    if (!dueDate) return
    const parsedDate = handleDates(dueDate)
    if (parsedDate) {
      return format(parsedDate, 'dd/MM/yyyy')
    }
    return ''
  }

  const getTotalValue = () => {
    const defaultValue = 0
    if (Number.isNaN(totalValue)) {
      return (
        defaultValue.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }) ?? ''
      )
    }

    return (
      totalValue?.toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      }) ?? ''
    )
  }

  return (
    <div className="bg-[#EBF9FE] text-[#155366] w-full flex items-center justify-start p-2 rounded-sm">
      {recurrent && (
        <label>
          Parcelas: {installments.totalInstallments} de {installmentsValue()} | Total:{' '}
          {getTotalValue()} | Primeira parcela: {installments.firstInstallmentDate} | Última
          parcela: {installments.lastInstallmentDate}
        </label>
      )}
      {!recurrent && (
        <label>
          Total: {getTotalValue()} | Data de Vencimento: {getDueDate()}
        </label>
      )}
    </div>
  )
}
