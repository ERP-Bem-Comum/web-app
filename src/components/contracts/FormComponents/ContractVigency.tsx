import { AutoComplete } from '@/components/layout/AutoComplete'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { ContractType } from '@/enums/contracts'
import { useOptions } from '@/hooks/useOptions'
import { Contract, otherContractSchema } from '@/types/contracts'
import { Grid, Checkbox, FormControlLabel } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors, Controller, UseFormSetValue } from 'react-hook-form'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'

interface ContractVigencyProps {
  control: Control<Contract>
  editable: boolean
  errors: FieldErrors<otherContractSchema>
  contractType: ContractType
  values: otherContractSchema
  setValue: UseFormSetValue<Contract>
}

export const ContractVigency = ({
  control,
  editable,
  errors,
  contractType,
  values,
  setValue,
}: ContractVigencyProps) => {
  const { options } = useOptions()
  const disableWhenIsFinancier = contractType === ContractType.FINANCIER
  const isIndefinite = values.contractPeriod?.isIndefinite ?? false

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Vigência:</TitleLabel>
      </Grid>
      <Grid item xs={12 / 3}>
        <AutoComplete
          error={errors.programId?.message as string}
          control={control}
          editable={!disableWhenIsFinancier && editable}
          options={options.Program()}
          name={'programId'}
          label="Programa:"
        />
      </Grid>
      <Grid item xs={12 / 3}>
        <AutoComplete
          error={errors.budgetPlanId?.message}
          control={control}
          editable={!disableWhenIsFinancier && editable}
          options={options.BudgetPlan()?.filter((op) => op.parentId === values.programId)}
          name={'budgetPlanId'}
          label="Plano orçamentário:"
        />
      </Grid>
      <Grid item xs={12 / 6}>
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
      <Grid item xs={12 / 6}>
        <Controller
          name="contractPeriod.end"
          control={control}
          render={({ field }) => (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
              <DatePicker
                label="Data Fim:"
                value={field.value ?? null}
                onChange={(date) => field.onChange(date)}
                disabled={!editable || isIndefinite}
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
      {contractType === ContractType.COLLABORATOR && (
        <Grid item xs={12}>
          <Controller
            name="contractPeriod.isIndefinite"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value ?? false}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      field.onChange(isChecked)

                      if (isChecked) {
                        setValue('contractPeriod.end', null)
                      }
                    }}
                    disabled={!editable}
                  />
                }
                label="Prazo Indeterminado (CLT)"
              />
            )}
          />
        </Grid>
      )}
    </Fragment>
  )
}
