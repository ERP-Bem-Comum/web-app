import { useGetAccountsPosition } from '@/services/reports'
import { AccountsPositionType, useAccountsPositionReturn } from '@/types/reports/accountsPosition'
import useReportFilter from './useReportFilter'

const useAccountsPosition = (type: AccountsPositionType): useAccountsPositionReturn => {
  const form = useReportFilter()

  const { accountsPosition, isLoadingAccountsPosition } = useGetAccountsPosition(form.values, type)

  return {
    data: accountsPosition?.data,
    isLoading: isLoadingAccountsPosition,
    form,
  }
}

export { useAccountsPosition }
