import { ParamsPayables } from '@/types/Payables'
import { Grid } from '@mui/material'
import { Control, FieldErrors } from 'react-hook-form'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { FilterValuePicker } from '@/components/layout/FilterComponents/FiltervaluePicker'
import { useOptions } from '@/hooks/useOptions'
import { Button } from '../../ui/button'
interface FilterPayablesProps {
  control: Control<ParamsPayables>
  errors: FieldErrors<ParamsPayables>
  handleFilter: () => void
}

export const FilterPayables = ({ control, errors, handleFilter }: FilterPayablesProps) => {
  const { options } = useOptions()

  return (
    <Grid container spacing={2} className="bg-[#F6FAFB] p-4 w-full m-0">
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.BudgetPlan()}
          name="payableParams.budgetPlanId"
          label="Plano Orçamentário:"
          editable
          error={errors.payableParams?.budgetPlanId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <FilterDate
          control={control}
          label="Vencimento:"
          error={errors.payableParams?.dueBetween?.message}
          field="payableParams.dueBetween"
        />
      </Grid>

      <FilterValuePicker control={control} name="payableParams.valueBetween" label="Valor (R$):" />
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.typeOptions}
          name="payableParams.paymentType"
          label="Tipo de despesas:"
          editable
          error={errors.payableParams?.paymentType?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.Accounts()}
          name="payableParams.accountId"
          label="Conta bancária:"
          editable
          error={errors.payableParams?.accountId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.statusOptions}
          name="payableParams.payableStatus"
          label="Status:"
          editable
          error={errors.payableParams?.payableStatus?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.CostCenter()}
          name="payableParams.costCenterId"
          label="Centro de custo:"
          editable
          error={errors.payableParams?.costCenterId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.Categories()}
          name="payableParams.categoryId"
          label="Categoria de custo:"
          editable
          error={errors.payableParams?.categoryId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.SubCategories()}
          name="payableParams.subCategoryId"
          label="Subcategoria de custo:"
          editable
          error={errors.payableParams?.subCategoryId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.Collaborators()}
          name="payableParams.approver"
          label="Aprovadores:"
          editable
          error={errors.payableParams?.approver?.message}
        />
      </Grid>
      <Grid item xs={12} container justifyContent="flex-end">
        <Button variant="erpSecondary" className="mr-4" onClick={handleFilter}>
          Filtrar
        </Button>
      </Grid>
    </Grid>
  )
}
