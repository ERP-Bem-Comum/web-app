import { Grid, TextField } from '@mui/material'
import { Control, FieldErrors } from 'react-hook-form'
import { filterReportParams } from '@/types/reports/filters'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { useOptions } from '@/hooks/useOptions'
import { Button } from '../../ui/button'
import { ReactNode, useCallback, useEffect } from 'react'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { maskMonetaryValue } from '@/utils/masks'

interface OptionalFields {
  program?: boolean
  limit?: boolean
  status?: boolean
  account?: boolean
  reportType?: boolean
}

interface ReportsFilterProps extends OptionalFields {
  control: Control<filterReportParams>
  errors: FieldErrors<filterReportParams>
  values: filterReportParams
  type?: AccountsPositionType | 'none'
  clearField: (field: keyof filterReportParams['reportsParams']) => void
  setLimit?: (value: number) => void
  handleFilter: () => void
  currentLimit?: number
  exportButton?: ReactNode
  extraSlot?: ReactNode
}

export const ReportsFilter = ({
  control,
  errors,
  values,
  type = 'none',
  exportButton,
  extraSlot,
  currentLimit,
  program = false,
  limit = false,
  status = false,
  account = false,
  reportType = false,
  clearField,
  setLimit,
  handleFilter,
}: ReportsFilterProps) => {
  const { options } = useOptions()

  const clearFieldsFrom = useCallback(
    (startField: keyof Required<filterReportParams['reportsParams']>) => {
      const fieldsToClear = (
        {
          budgetPlanId: ['costCenterId', 'categoryId', 'subCategoryId'],
          costCenterId: ['categoryId', 'subCategoryId'],
          categoryId: ['subCategoryId'],
        } as unknown as Record<
          keyof Required<filterReportParams['reportsParams']>,
          (keyof Required<filterReportParams['reportsParams']>)[]
        >
      )[startField]
      if (fieldsToClear && fieldsToClear.length > 0) {
        fieldsToClear.forEach(clearField)
      }
    },
    [clearField],
  )

  useEffect(() => {
    if (!values.reportsParams.budgetPlanId) clearFieldsFrom('budgetPlanId')
    if (!values.reportsParams.costCenterId) clearFieldsFrom('costCenterId')
    if (!values.reportsParams.categoryId) clearFieldsFrom('categoryId')
  }, [
    values.reportsParams.budgetPlanId,
    values.reportsParams.costCenterId,
    values.reportsParams.categoryId,
    clearFieldsFrom,
  ])

  return (
    <div className="w-full h-full p-5">
      <Grid container spacing={2} className="bg-[#F6FAFB] p-4 w-full m-0">
        {program && (
          <Grid item xs={12 / 5}>
            <AutoComplete
              control={control}
              options={options.Program()}
              name="reportsParams.programId"
              label="Programa:"
              editable
              error={errors.reportsParams?.programId?.message}
            />
          </Grid>
        )}
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            options={
              !program
                ? options.BudgetPlan()
                : (options
                    .BudgetPlan()
                    ?.filter((cc) => cc.parentId === values.reportsParams?.programId) ?? [])
            }
            name="reportsParams.budgetPlanId"
            label="Plano Orçamentário:"
            editable={program ? !!values.reportsParams?.programId : true}
            error={errors.reportsParams?.budgetPlanId?.message}
          />
        </Grid>
        <Grid item xs={12 / 5}>
          <FilterDate
            control={control}
            label="Periodo:"
            error={errors.reportsParams?.dueBetween?.message}
            field="reportsParams.dueBetween"
          />
        </Grid>

        {limit && (
          <Grid item xs={12 / 5}>
            <TextField
              name="limit"
              label="Limite:"
              size="small"
              className="mb-6"
              fullWidth
              value={maskMonetaryValue(currentLimit ?? 0)}
              onChange={(e) => {
                setLimit && setLimit(Number(e.target.value.replace(/\D/g, '')) / 100)
              }}
            />
          </Grid>
        )}
        {account && (
          <Grid item xs={12 / 5}>
            <AutoComplete
              control={control}
              options={options.Accounts()}
              name="reportsParams.accountId"
              label="Conta bancária:"
              editable
              error={errors.reportsParams?.accountId?.message}
            />
          </Grid>
        )}
        {status && (
          <Grid item xs={12 / 5}>
            <AutoComplete
              control={control}
              options={
                type === 'receivable'
                  ? options.statusOptionsReceivables
                  : type === 'payable'
                    ? options.statusOptionsPayables
                    : options.statusOptionMerged
              }
              name="reportsParams.status"
              label="Status:"
              editable
              error={errors.reportsParams?.status?.message}
            />
          </Grid>
        )}
        {reportType && (
          <Grid item xs={12 / 5}>
            <AutoComplete
              control={control}
              options={options.reportTypeOption}
              name="reportsParams.reportType"
              label="Tipo:"
              editable
              error={errors.reportsParams?.reportType?.message}
            />
          </Grid>
        )}
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            options={
              options
                .CostCenter()
                ?.filter((cc) => cc.parentId === values.reportsParams?.budgetPlanId) ?? []
            }
            name="reportsParams.costCenterId"
            label="Centro de custo:"
            editable={!!values.reportsParams?.budgetPlanId}
            error={errors.reportsParams?.costCenterId?.message}
          />
        </Grid>
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            editable={!!values.reportsParams.costCenterId}
            options={
              options
                .Categories()
                ?.filter((ca) => ca.parentId === values.reportsParams.costCenterId) ?? []
            }
            name="reportsParams.categoryId"
            label="Categoria de custo:"
            error={errors.reportsParams?.categoryId?.message}
          />
        </Grid>
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            editable={!!values.reportsParams?.categoryId}
            options={
              options
                .SubCategories()
                ?.filter((sc) => sc.parentId === values.reportsParams?.categoryId) ?? []
            }
            name="reportsParams.subCategoryId"
            label="Subcategoria de custo:"
            error={errors.reportsParams?.subCategoryId?.message}
          />
        </Grid>
        {type !== 'none' && (
          <Grid item xs={12 / 5}>
            <AutoComplete
              control={control}
              editable={true}
              options={type === 'payable' ? options.Suppliers() : options.Financiers()}
              name="reportsParams.entityId"
              label={type === 'payable' ? 'Fornecedor' : 'Financiador'}
              error={errors.reportsParams?.entityId?.message}
            />
          </Grid>
        )}
        <Grid item xs={24 / 5} justifyContent="flex-start" gap={5}>
          <Button variant="erpSecondary" className="mr-4" onClick={handleFilter}>
            Filtrar
          </Button>
          {exportButton}
          {extraSlot && extraSlot}
        </Grid>
      </Grid>
    </div>
  )
}
