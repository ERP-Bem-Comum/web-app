import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { ReceivableType } from '@/enums/receivables'
import { useOptions } from '@/hooks/useOptions'
import { Receivable } from '@/types/receivables'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { Control, FieldErrors } from 'react-hook-form'

interface ReceivableReceiptionProps {
  control: Control<Receivable>
  edit: boolean
  errors: FieldErrors<Receivable>
  hasReceivable: boolean
  values: Receivable
  hasContract: boolean
}

export const ReceivableReceiption = ({
  control,
  edit,
  errors,
  hasReceivable,
  values,
  hasContract,
}: ReceivableReceiptionProps) => {
  const { options } = useOptions()
  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Recebimento:</TitleLabel>
      </Grid>
      <Grid container rowSpacing={2} columnSpacing={2}>
        <Grid item xs={4}>
          <AutoComplete
            error={errors.receivableType?.message}
            control={control}
            editable={
              edit &&
              ![ReceivableType.DISTRATO, ReceivableType.TERMO].includes(values.receivableType)
            }
            options={
              hasReceivable
                ? options.receivableType
                : hasContract
                  ? options.receivableType.slice(0, 2)
                  : options.receivableType.slice(1, 2)
            }
            name="receivableType"
            label="Tipo de recebimento:"
          />
        </Grid>
        <Grid item xs={4}>
          <CustomTextField
            error={errors.totalValue?.message}
            control={control}
            editable={
              edit &&
              ![ReceivableType.DISTRATO, ReceivableType.TERMO].includes(values.receivableType)
            }
            name="totalValue"
            label="Valor:"
            currency
          />
        </Grid>
        <Grid item xs={4}>
          <AutoComplete
            error={errors.receiptMethod?.message}
            control={control}
            editable={edit}
            options={options.paymentMethodOptions}
            name="receiptMethod"
            label="Forma de recebimento:"
          />
        </Grid>
        <Grid item xs={4}>
          <CustomTextField
            error={errors.description?.message}
            control={control}
            editable={edit}
            name="description"
            label="Descrição:"
          />
        </Grid>
        <Grid item xs={2}>
          <AutoComplete
            error={errors.docType?.message}
            control={control}
            editable={edit}
            options={options.docTypeOptions}
            name="docType"
            label="Documento identificador:"
          />
        </Grid>
        <Grid item xs={2}>
          <CustomTextField
            error={errors.identifierCode?.message}
            control={control}
            editable={edit}
            name="identifierCode"
            label="Código identificador:"
          />
        </Grid>
        <Grid item xs={4}>
          <AutoComplete
            error={errors.accountId?.message}
            control={control}
            editable={edit}
            options={options.Accounts()}
            name="accountId"
            label="Receber na conta:"
          />
        </Grid>
      </Grid>
    </Fragment>
  )
}
