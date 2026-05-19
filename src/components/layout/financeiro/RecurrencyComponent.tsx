import { PaymentType, RecurenceType, PaymentMethod } from '@/enums/payables'
import { useOptions } from '@/hooks/useOptions'
import { Options } from '@/types/global'
import { Grid } from '@mui/material'
import { Fragment, useCallback, useEffect } from 'react'
import {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormResetField,
  UseFormSetValue,
} from 'react-hook-form'
import { AutoComplete } from '../AutoComplete'
import { CustomDatePicker } from '../DatePicker'
import { TitleLabel } from '../TitleLabel'
import { CustomToggle } from '../Toggle'
import { CustomTextField } from '@/components/layout/TextField'

type recurrenceData = {
  recurrenceType: RecurenceType
  startDate: Date
  endDate: Date
  dueDay: number
}

interface RecurrencyComponentProps<T extends FieldValues> {
  control: Control<T>
  edit: boolean
  errors: FieldErrors<T>
  values: T
  setValue: UseFormSetValue<T>
}

export const RecurrencyComponent = <T extends FieldValues>({
  control,
  edit,
  errors,
  values,
  setValue,
}: RecurrencyComponentProps<T>) => {
  const { options } = useOptions()

  function getRecurrenceError<T extends FieldValues>(
    errors: FieldErrors<T>,
    field: keyof recurrenceData,
  ): string | undefined {
    if (errors.recurenceData) {
      return (errors.recurenceData as FieldErrors<recurrenceData>)[field]?.message as string
    }

    return undefined
  }

  const resetFields = useCallback(() => {
    setValue('dueDate' as Path<T>, null as any)
    setValue('recurenceData.recurrenceType' as Path<T>, null as any)
    setValue('recurenceData.startDate' as Path<T>, null as any)
    setValue('recurenceData.endDate' as Path<T>, null as any)
    setValue('recurenceData.dueDay' as Path<T>, null as any)
  }, [setValue])

  return (
    <Fragment>
      <Grid item xs={12} display={'flex'}>
        <CustomToggle
          control={control}
          editable={(() => {
            const type = values.paymentType || values.receivableType
            return edit && ![PaymentType.DISTRATO, PaymentType.TERMO].includes(type)
          })()}
          name={'recurrent' as Path<T>}
          label="Recorrente:"
          onClick={resetFields}
        />
      </Grid>
      {!values.recurrent ? (
        <Grid container rowSpacing={2} columnSpacing={2}>
          <Grid item xs={3}>
            <CustomDatePicker
              error={errors.dueDate?.message as string}
              control={control}
              editable={edit}
              name={'dueDate' as Path<T>}
              label="Data vencimento:"
            />
          </Grid>
          {values.paymentMethod === PaymentMethod.BILL && (
            <Grid item xs={2.2}>
              <CustomTextField
                error={errors.barcode?.message as string}
                control={control}
                editable={edit}
                maxLength={44}
                name={'barcode' as Path<T>}
                label="Código de Barras:"
              />
            </Grid>
          )}
        </Grid>
      ) : (
        <Grid container rowSpacing={2} columnSpacing={2}>
          <Grid item xs={3.8}>
            <AutoComplete
              error={getRecurrenceError(errors, 'recurrenceType')}
              control={control}
              editable={edit}
              options={options.recurrenceTypeOptions}
              name={'recurenceData.recurrenceType' as Path<T>}
              label="Tipo de recorrencia:"
            />
          </Grid>

          <Grid item xs={2.73}>
            <CustomDatePicker
              error={getRecurrenceError(errors, 'startDate')}
              control={control}
              editable={edit}
              name={'recurenceData.startDate' as Path<T>}
              label="Data inicio:"
            />
          </Grid>
          <Grid item xs={2.73}>
            <CustomDatePicker
              error={getRecurrenceError(errors, 'endDate')}
              control={control}
              editable={edit}
              name={'recurenceData.endDate' as Path<T>}
              label="Data final:"
            />
          </Grid>
          <Grid item xs={2.73}>
            <AutoComplete
              error={getRecurrenceError(errors, 'dueDay')}
              control={control}
              editable={edit}
              options={
                Array.from(Array(31).keys()).flatMap((key) => ({
                  id: key + 1,
                  name: String(key + 1),
                })) as Options[]
              }
              name={'recurenceData.dueDay' as Path<T>}
              label="Dia vencimento:"
            />
          </Grid>
        </Grid>
      )}
    </Fragment>
  )
}
