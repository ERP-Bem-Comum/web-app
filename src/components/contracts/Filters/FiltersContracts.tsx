import { Grid } from '@mui/material'
import { Control, FieldErrors } from 'react-hook-form'

import { AutoComplete } from '@/components/layout/AutoComplete'
import { FilterDate } from '@/components/layout/FilterComponents/FilterDate'
import { useOptions } from '@/hooks/useOptions'
import { ParamsContracts } from '@/types/contracts'
import { Button } from '../../ui/button'

interface FilterPayablesProps {
  control: Control<ParamsContracts>
  errors: FieldErrors<ParamsContracts>
  handleFilter: () => void
}

export const FilterContracts = ({ control, errors, handleFilter }: FilterPayablesProps) => {
  const { options, contractsOp } = useOptions()

  return (
    <Grid container spacing={2} className="p-4 w-full m-0 items-center">
      <Grid size={{ xs: 13.8 / 5 }}>
        <AutoComplete
          control={control}
          options={options.BudgetPlan()}
          name="payableParams.budgetPlanId"
          label="Plano Orçamentário:"
          placeholder="Selecione o plano"
          editable
          error={errors.payableParams?.budgetPlanId?.message}
        />
      </Grid>
      <Grid size={{ xs: 13.8 / 5 }}>
        <AutoComplete
          control={control}
          options={contractsOp.contractType}
          name="payableParams.contractType"
          label="Tipo de contrato:"
          placeholder="Selecione o tipo"
          editable
          error={errors.payableParams?.contractType?.message}
        />
      </Grid>
      <Grid size={{ xs: 13.8 / 5 }}>
        <FilterDate
          control={control}
          label="Vigência:"
          field="payableParams.contractPeriod"
          error={errors.payableParams?.contractPeriod?.message}
        />
      </Grid>
      <Grid sx={{ width: 'fit-content', justifyContent: 'flex-end' }} container>
        <Button
          variant="erpSecondary"
          className="mr-4"
          onClick={control.handleSubmit(
            () => handleFilter(),
            (errors) => console.error(errors),
          )}
        >
          Filtrar
        </Button>
      </Grid>
    </Grid>
  )
}
