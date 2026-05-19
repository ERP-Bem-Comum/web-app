import { AutoComplete } from '@/components/layout/AutoComplete'
import { AutoCompleteMultipleWithMassApprover } from '@/components/layout/AutoCompleteMultipleWithMassApprover'
import { CustomTextField } from '@/components/layout/TextField'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { CustomDatePicker } from '@/components/layout/DatePicker'
import { DebtorType, PaymentType } from '@/enums/payables'
import { useOptions } from '@/hooks/useOptions'
import { Payable } from '@/types/Payables'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors } from 'react-hook-form'

interface PayablePaymentProps {
  control: Control<Payable>
  edit: boolean
  errors: FieldErrors<Payable>
  hasPayable: boolean
  values: Payable
  hasContract: boolean
}

export const PayablePayment = ({
  control,
  edit,
  errors,
  hasPayable,
  values,
  hasContract,
}: PayablePaymentProps) => {
  const { options } = useOptions()

  function filterOptions() {
    let filteredOptions = options.typeOptions
    if (!hasPayable) {
      filteredOptions = filteredOptions.filter((o) => o.name !== PaymentType.CONTRACT)

      if (values.contractId || hasContract || values.debtorType === DebtorType.COLLABORATOR) {
        filteredOptions = options.typeOptions.slice(0, 3)
      }
    }
    return filteredOptions
  }

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Pagamento:</TitleLabel>
      </Grid>
      <Grid container rowSpacing={2} columnSpacing={2}>
        <Grid item xs={3}>
          <AutoComplete
            error={errors.paymentType?.message}
            control={control}
            editable={
              edit &&
              values.debtorType !== DebtorType.COLLABORATOR &&
              values.paymentType !== PaymentType.CARDBILL
            }
            options={filterOptions()}
            name="paymentType"
            label="Tipo de pagamento:"
          />
        </Grid>
        <Grid item xs={2}>
          <CustomTextField
            error={errors.liquidValue?.message}
            control={control}
            editable={edit && values.paymentType !== PaymentType.CARDBILL}
            name="liquidValue"
            label="Valor líquido:"
            currency
          />
        </Grid>
        <Grid item xs={2}>
          <CustomTextField
            error={errors.taxValue?.message}
            control={control}
            editable={edit && values.paymentType !== PaymentType.CARDBILL}
            name="taxValue"
            label="Valor Impostos:"
            currency
          />
        </Grid>
        <Grid item xs={2}>
          <AutoComplete
            error={errors.paymentMethod?.message}
            control={control}
            editable={edit}
            options={options.paymentMethodOptions}
            name="paymentMethod"
            label="Forma de pagamento:"
          />
        </Grid>
        <Grid item xs={3}>
          <AutoCompleteMultipleWithMassApprover
            error={errors.approvers?.message}
            control={control}
            editable={edit}
            options={options.Collaborators() ?? []}
            name="approvers"
            label="Aprovadores:"
          />
        </Grid>

        <Grid item xs={3.8}>
          <CustomTextField
            error={errors.obs?.message}
            control={control}
            editable={edit}
            name="obs"
            label="Descrição:"
          />
        </Grid>
        <Grid item xs={2.2}>
          <AutoComplete
            error={errors.docType?.message}
            control={control}
            editable={edit}
            options={options.docTypeOptions}
            name="docType"
            label="Documento identificador:"
          />
        </Grid>
        <Grid item xs={2.2}>
          <CustomTextField
            error={errors.identifierCode?.message}
            control={control}
            editable={edit}
            name="identifierCode"
            label="Código identificador:"
          />
        </Grid>
        <Grid item xs={2}>
          <CustomDatePicker
            error={errors.competenceDate?.message}
            control={control}
            editable={edit}
            name="competenceDate"
            label="Competência:"
          />
        </Grid>
        <Grid item xs={3.8}>
          <AutoComplete
            error={errors.accountId?.message}
            control={control}
            editable={edit}
            options={options.Accounts()}
            name="accountId"
            label="Pagar da conta:"
          />
        </Grid>
      </Grid>
    </Fragment>
  )
}
