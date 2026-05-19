import { Grid } from '@mui/material'
import { Control, FieldErrors } from 'react-hook-form'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { FilterValuePicker } from '@/components/layout/FilterComponents/FiltervaluePicker'
import { useOptions } from '@/hooks/useOptions'
import { ParamsReceivables } from '@/types/receivables'
import { Button } from '../../ui/button'

interface FilterReceivableProps {
  control: Control<ParamsReceivables>
  errors: FieldErrors<ParamsReceivables>
  handleFilter: () => void
}

export const FilterReceivable = ({ control, errors, handleFilter }: FilterReceivableProps) => {
  const { options } = useOptions()

  return (
    <Grid container spacing={2} className="bg-[#F6FAFB] p-4 w-full m-0">
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.BudgetPlan()}
          name="receivableParams.budgetPlanId"
          label="Plano Orçamentário:"
          editable
          error={errors.receivableParams?.budgetPlanId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <FilterDate
          control={control}
          label="Vencimento:"
          field="receivableParams.dueBetween"
          error={errors.receivableParams?.dueBetween?.message}
        />
      </Grid>

      <FilterValuePicker
        control={control}
        name="receivableParams.valueBetween"
        label="Valor (R$):"
      />
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.receivableType}
          name="receivableParams.receivableType"
          label="Tipo de receita:"
          editable
          error={errors.receivableParams?.receivableType?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.Accounts()}
          name="receivableParams.accountId"
          label="Conta bancária:"
          editable
          error={errors.receivableParams?.accountId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.statusOptionsReceivables}
          name="receivableParams.receivableStatus"
          label="Status:"
          editable
          error={errors.receivableParams?.receivableStatus?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.CostCenter()}
          name="receivableParams.costCenterId"
          label="Centro de custo:"
          editable
          error={errors.receivableParams?.costCenterId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.Categories()}
          name="receivableParams.categoryId"
          label="Categoria de custo:"
          editable
          error={errors.receivableParams?.categoryId?.message}
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          control={control}
          options={options.SubCategories()}
          name="receivableParams.subCategoryId"
          label="Subcategoria de custo:"
          editable
          error={errors.receivableParams?.subCategoryId?.message}
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
