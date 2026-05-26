import { AutoComplete } from '@/components/layout/AutoComplete'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { ContractType } from '@/enums/contracts'
import { useOptions } from '@/hooks/useOptions'
import { Contract, otherContractSchema } from '@/types/contracts'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors, Controller } from 'react-hook-form'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'

interface ContractVigencyProps {
  control: Control<Contract>
  editable: boolean
  errors: FieldErrors<otherContractSchema>
  contractType: ContractType
  values: otherContractSchema
}

export const ContractVigency = ({
  control,
  editable,
  errors,
  contractType,
  values,
}: ContractVigencyProps) => {
  const { options } = useOptions()
  const disableWhenIsFinancier = contractType === ContractType.FINANCIER

  return (
    <Fragment>
      <Grid size={{ xs: 12 }}>
        <TitleLabel>Vigência:</TitleLabel>
      </Grid>
      <Grid size={{ xs: 12 / 3 }}>
        <AutoComplete
          error={errors.programId?.message as string}
          control={control}
          editable={!disableWhenIsFinancier && editable}
          options={options.Program()}
          name={'programId'}
          label="Programa:"
        />
      </Grid>
      <Grid size={{ xs: 12 / 3 }}>
        <AutoComplete
          error={errors.budgetPlanId?.message}
          control={control}
          editable={!disableWhenIsFinancier && editable}
          options={options.BudgetPlan()?.filter((op) => op.parentId === values.programId)}
          name={'budgetPlanId'}
          label="Plano orçamentário:"
        />
      </Grid>
      <Grid size={{ xs: 12 / 6 }}>
        <Controller
          name="contractPeriod.start"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
              <DatePicker
                label="Data Início:"
                value={field.value ?? null}
                onChange={(date) => field.onChange(date)}
                disabled={!editable}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors.contractPeriod?.start,
                    helperText: errors.contractPeriod?.start?.message,
                  },
                }}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12 / 6 }}>
        <Controller
          name="contractPeriod.end"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
              <DatePicker
                label="Data Fim:"
                value={field.value ?? null}
                onChange={(date) => field.onChange(date)}
                disabled={!editable}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors.contractPeriod?.end,
                    helperText: errors.contractPeriod?.end?.message,
                  },
                }}
              />
            </LocalizationProvider>
          )}
        />
      </Grid>
    </Fragment>
  )
}
