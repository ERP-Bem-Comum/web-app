import { ContractModel, ContractStatus, ContractType } from '@/enums/contracts'
import { DOCType, PayableStatus, PaymentMethod, PaymentType, RecurenceType } from '@/enums/payables'
import { ReceivableStatus, ReceivableType } from '@/enums/receivables'
import { getBudgetPlanOptions } from '@/services/budgetPlan'
import { getCollaboratorsOptions } from '@/services/collaborator'
import {
  getCategoriesOptions,
  getCostCenterOptions,
  getSubCategoriesOptions,
} from '@/services/costCenter'
import { getProgramOptions } from '@/services/programs'
import { bankAccounts, pixKeyTypes } from '@/utils/enums'
import { queryClient } from 'lib/react-query'
import useLazyQuery from './useLazyQuery'
import useLoadLocalOptions from './useLoadLocalOptions'
import { getBankAccountOptions } from '@/services/bankAccount'
import { getSupplierOptions } from '@/services/supplier'
import { getFinancierOptions } from '@/services/financier'
import { MergedStatusForReportFilter } from '@/types/reports/filters'
import { AnalysisType } from '@/enums/reports'
import { getStateOptions } from '@/services/state'
import { getCitiesOptions } from '@/services/city'
import { ReportType } from '@/types/reports/generalReport'

export const useOptions = () => {
  const { getData: BudgetPlan } = useLazyQuery('budgetPlanOptions', getBudgetPlanOptions)
  const { getData: Collaborators } = useLazyQuery('collaboratorsOptions', getCollaboratorsOptions)
  const { getData: CostCenter } = useLazyQuery('costCenterOptions', getCostCenterOptions)
  const { getData: Categories } = useLazyQuery('categoriesOptions', getCategoriesOptions)
  const { getData: SubCategories } = useLazyQuery('subCategoriesOptions', getSubCategoriesOptions)
  const { getData: Program } = useLazyQuery('programOptions', getProgramOptions)
  const { getData: Accounts } = useLazyQuery('accountsOptions', getBankAccountOptions)
  const { getData: Suppliers } = useLazyQuery('suppliersOptions', getSupplierOptions)
  const { getData: Financiers } = useLazyQuery('financierOptions', getFinancierOptions)
  const { getData: States } = useLazyQuery('stateOptions', getStateOptions)
  const { getData: Cities } = useLazyQuery('citiesOptions', getCitiesOptions)

  const refetchBudgetPlanAndNested = () => {
    queryClient.refetchQueries({ queryKey: ['budgetPlanOptions'] })
    queryClient.refetchQueries({ queryKey: ['costCenterOptions'] })
    queryClient.refetchQueries({ queryKey: ['categoriesOptions'] })
    queryClient.refetchQueries({ queryKey: ['subCategoriesOptions'] })
  }

  const refetchCostCenterAndNested = () => {
    queryClient.refetchQueries({ queryKey: ['costCenterOptions'] })
    queryClient.refetchQueries({ queryKey: ['categoriesOptions'] })
    queryClient.refetchQueries({ queryKey: ['subCategoriesOptions'] })
  }

  const typeOptions = useLoadLocalOptions(PaymentType)
  const paymentMethodOptions = useLoadLocalOptions(PaymentMethod)
  const docTypeOptions = useLoadLocalOptions(DOCType)
  const recurrenceTypeOptions = useLoadLocalOptions(RecurenceType)
  const statusOptions = useLoadLocalOptions(PayableStatus)
  const statusOptionsReceivables = useLoadLocalOptions(ReceivableStatus)
  const statusOptionsPayables = useLoadLocalOptions(PayableStatus)
  const statusOptionMerged = useLoadLocalOptions(MergedStatusForReportFilter)
  const receivableType = useLoadLocalOptions(ReceivableType)
  const pixTypes = useLoadLocalOptions(pixKeyTypes, 'k')
  const contractType = useLoadLocalOptions(ContractType)
  const contractStatus = useLoadLocalOptions(ContractStatus)
  const contractModel = useLoadLocalOptions(ContractModel)
  const bankOptions = useLoadLocalOptions(bankAccounts)
  const analysisTypeOption = useLoadLocalOptions(AnalysisType)
  const reportTypeOption = useLoadLocalOptions(ReportType, 'k')

  return {
    options: {
      typeOptions,
      paymentMethodOptions,
      statusOptions,
      docTypeOptions,
      recurrenceTypeOptions,
      pixTypes,
      statusOptionsReceivables,
      statusOptionMerged,
      statusOptionsPayables,
      receivableType,
      bankOptions,
      reportTypeOption,
      Accounts,
      BudgetPlan,
      Collaborators,
      CostCenter,
      Categories,
      SubCategories,
      Program,
      Suppliers,
      Financiers,
      analysisTypeOption,
      States,
      Cities,
    },
    contractsOp: {
      contractType,
      contractStatus,
      contractModel,
    },
    refetch: {
      refetchBudgetPlanAndNested,
      refetchCostCenterAndNested,
    },
  }
}
