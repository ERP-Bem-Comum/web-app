import { AutoComplete } from '@/components/layout/AutoComplete'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { DebtorType } from '@/enums/payables'
import { Payable } from '@/types/Payables'
import { Grid } from '@mui/material'
import { Fragment, ReactNode } from 'react'
import { Control, FieldErrors } from 'react-hook-form'

interface PayablePaymentSubjectProps {
  control: Control<Payable>
  edit: boolean
  errors: FieldErrors<Payable>
  changeDebtorTypeCallback: (debtorType: DebtorType) => void
  children: ReactNode
}

export const PayablePaymentSubject = ({
  control,
  edit,
  errors,
  children,
  changeDebtorTypeCallback,
}: PayablePaymentSubjectProps) => {
  return (
    <Fragment>
      <Grid
        item
        xs={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <TitleLabel>Escolha um</TitleLabel>
        <AutoComplete
          control={control}
          editable={edit}
          error={errors.debtorType?.message}
          label=""
          name="debtorType"
          options={Object.values(DebtorType).map((key) => ({
            id: key,
            name: key,
          }))}
          aditionalOnChangeBehavior={(val) => changeDebtorTypeCallback(val as DebtorType)}
        />
      </Grid>
      {children}
    </Fragment>
  )
}
