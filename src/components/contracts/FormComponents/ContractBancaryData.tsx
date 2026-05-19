import { AgencyComponent } from '@/components/layout/AgencyComponent'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { useOptions } from '@/hooks/useOptions'
import { Contract } from '@/types/contracts'
import { BancaryInfo } from '@/types/global'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors } from 'react-hook-form'

interface ContractBancaryDataProps {
  control: Control<Contract>
  editable: boolean
  errors: FieldErrors<{ bancaryInfo: BancaryInfo }>
}

export const ContractBancaryData = ({ control, editable, errors }: ContractBancaryDataProps) => {
  const {
    options: { bankOptions },
  } = useOptions()

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Dados bancários:</TitleLabel>
      </Grid>
      <Grid item xs={12 / 4}>
        <AutoComplete
          control={control}
          editable={editable}
          label="Banco"
          name="bancaryInfo.bank"
          options={bankOptions}
          error={errors.bancaryInfo?.bank?.message || errors.bancaryInfo?.root?.message}
        />
      </Grid>
      <Grid item xs={12 / 4}>
        <AgencyComponent
          control={control}
          editable={editable}
          error={errors.bancaryInfo?.agency?.message || errors.bancaryInfo?.root?.message}
          name="bancaryInfo.agency"
        />
      </Grid>
      <Grid item xs={12 / 4}>
        <CustomTextField
          error={errors.bancaryInfo?.accountNumber?.message || errors.bancaryInfo?.root?.message}
          control={control}
          editable={editable}
          name="bancaryInfo.accountNumber"
          label="Número da Conta"
        />
      </Grid>
      <Grid item xs={12 / 4}>
        <CustomTextField
          error={undefined}
          control={control}
          editable={editable}
          name="bancaryInfo.dv"
          label="Dv"
          maxLength={1}
        />
      </Grid>
    </Fragment>
  )
}
