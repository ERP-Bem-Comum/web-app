import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { useOptions } from '@/hooks/useOptions'
import { Contract } from '@/types/contracts'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors, UseFormReset } from 'react-hook-form'

interface ContractInfoProps {
  control: Control<Contract>
  editable: boolean
  errors: FieldErrors<Contract>
  isAditive: boolean
}

export const ContractInfo = ({ control, editable, errors, isAditive }: ContractInfoProps) => {
  const { contractsOp } = useOptions()

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Contrato:</TitleLabel>
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          error={errors.contractType?.message}
          control={control}
          editable={editable && !isAditive}
          options={contractsOp.contractType}
          name={'contractType'}
          label="Tipo:"
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          error={errors.contractModel?.message as string}
          control={control}
          editable={editable}
          options={contractsOp.contractModel}
          name={'contractModel'}
          label="Modelo:"
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <CustomTextField
          error={errors.object?.message}
          control={control}
          editable={editable}
          name="object"
          label="Objeto:"
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <CustomTextField
          error={errors.totalValue?.message}
          control={control}
          editable={editable}
          name="totalValue"
          label="R$ Valor"
          currency
        />
      </Grid>
      <Grid item xs={12 / 5}>
        <AutoComplete
          error={errors.agreement?.message}
          control={control}
          editable={editable}
          options={[
            { id: 1, name: 'Sim' },
            { id: 0, name: 'Não' },
          ]}
          name={'agreement'}
          label="Acordo de Cooperação?"
        />
      </Grid>
    </Fragment>
  )
}
