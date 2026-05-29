import { RecurenceType } from '@/enums/payables'
import { addMonths, differenceInMonths, set } from 'date-fns'
import { formatDate, handleDates } from './dates'

type InstallmentData = {
  recurrenceData:
    | {
        recurrenceType?: RecurenceType | null
        startDate?: Date | null
        endDate?: Date | null
        dueDay?: number | null
      }
    | undefined
    | null
  recurrent: boolean
}

export const getInstallmentInfo = ({ recurrent, recurrenceData }: InstallmentData) => {
  if (!recurrent || !recurrenceData) {
    return {
      totalInstallments: 0,
      firstInstallmentDate: null,
      lastInstallmentDate: null,
    }
  }

  const { startDate, endDate, recurrenceType, dueDay } = recurrenceData

  const parsedStartDate = handleDates(startDate)
  const parsedEndDate = handleDates(endDate)

  if (!parsedStartDate || !parsedEndDate || !dueDay || !recurrenceType) {
    return {
      totalInstallments: 0,
      firstInstallmentDate: null,
      lastInstallmentDate: null,
    }
  }

  let totalInstallments = 0
  let firstInstallmentDate = null
  let lastInstallmentDate = null

  const monthsBetween = differenceInMonths(parsedEndDate, parsedStartDate)

  switch (recurrenceType) {
    case RecurenceType.MONTHLY:
      totalInstallments = monthsBetween + 1 // +1 to include the first month
      break
    case RecurenceType.QUARTERLY:
      totalInstallments = Math.floor(monthsBetween / 3) + 1
      break
    case RecurenceType.BIANNUAL:
      totalInstallments = Math.floor(monthsBetween / 6) + 1
      break
    case RecurenceType.ANNUALLY:
      totalInstallments = Math.floor(monthsBetween / 12) + 1
      break
    case RecurenceType.BIMONTLY:
      totalInstallments = Math.floor(monthsBetween / 2) + 1
      break
    default:
      return { totalInstallments: 0, firstInstallmentDate: null, lastInstallmentDate: null }
  }

  firstInstallmentDate = formatDate(set(parsedStartDate, { date: dueDay }))

  // Calculate the last installment date by adding the appropriate number of months
  const lastInstallmentMonth = addMonths(
    parsedStartDate,
    (totalInstallments - 1) *
      (recurrenceType === RecurenceType.MONTHLY
        ? 1
        : recurrenceType === RecurenceType.BIMONTLY
          ? 2
          : recurrenceType === RecurenceType.QUARTERLY
            ? 3
            : recurrenceType === RecurenceType.BIANNUAL
              ? 6
              : 12),
  )
  lastInstallmentDate = formatDate(set(lastInstallmentMonth, { date: dueDay }))

  return { totalInstallments, firstInstallmentDate, lastInstallmentDate }
}

export const getMinimumDaysBetween = (recurrenceType: RecurenceType | undefined | null) => {
  const daysMap: { [key in RecurenceType]: number } = {
    [RecurenceType.MONTHLY]: 30,
    [RecurenceType.QUARTERLY]: 90,
    [RecurenceType.BIANNUAL]: 180,
    [RecurenceType.ANNUALLY]: 360,
    [RecurenceType.BIMONTLY]: 60,
  }
  return recurrenceType ? daysMap[recurrenceType] : null
}
