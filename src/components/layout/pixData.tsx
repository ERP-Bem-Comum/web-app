import { AutoComplete } from '@/components/layout/AutoComplete'
import { PixKeyComponent } from '@/components/layout/PixKeyComponent'
import { useOptions } from '@/hooks/useOptions'
import { PixInfo } from '@/types/global'
import { Grid } from '@mui/material'
import { Fragment, useRef } from 'react'
import {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
} from 'react-hook-form'

interface ContractPixDataProps<T extends FieldValues> {
  control: Control<T>
  setValue: UseFormSetValue<T>
  editable: boolean
  errors: FieldErrors<{ pixInfo: PixInfo }>
  values: PixInfo | null
}

export const PixData = <T extends FieldValues>({
  control,
  editable,
  errors,
  values,
  setValue,
}: ContractPixDataProps<T>) => {
  const { options } = useOptions()
  const isMounted = useRef(false)

  const resetKey = () => {
    if (isMounted.current) {
      setValue('pixInfo.key' as Path<T>, null as PathValue<null, never>)
    } else {
      isMounted.current = true
    }
  }

  return (
    <Fragment>
      <Grid item xs={12 / 4}>
        <AutoComplete
          error={errors?.pixInfo?.key_type?.message || errors?.pixInfo?.root?.message}
          control={control}
          editable={editable}
          options={options.pixTypes}
          name={'pixInfo.key_type' as Path<T>}
          label="Tipo de chave:"
          aditionalOnChangeBehavior={resetKey}
        />
      </Grid>
      <Grid item xs={12 / 4}>
        <PixKeyComponent
          control={control}
          editable={editable}
          keyType={values?.key_type ?? ''}
          error={errors?.pixInfo?.key?.message || errors?.pixInfo?.root?.message}
        />
      </Grid>
    </Fragment>
  )
}
