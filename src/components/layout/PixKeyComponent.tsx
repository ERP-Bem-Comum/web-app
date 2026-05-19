import { maskPixType } from '@/utils/masks'
import { TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface PixKeyComponentProps<T extends FieldValues> {
  control: Control<T>
  editable: boolean
  error?: string
  keyType: string
}

export const PixKeyComponent = <T extends FieldValues>({
  control,
  editable,
  error,
  keyType,
}: PixKeyComponentProps<T>) => {
  const getLength = () => {
    switch (keyType) {
      case 'EMAIL':
        return 50
      case 'ALEATORY_KEY':
        return 200
      case 'CPF':
        return 14
      case 'CNPJ':
        return 18
      case 'CELLPHONE':
        return 14
      default:
        return 20
    }
  }

  return (
    <Controller
      name={'pixInfo.key' as Path<T>}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={maskPixType(field.value, keyType)}
          onChange={(e) => {
            if (!['EMAIL', 'ALEATORY_KEY'].includes(keyType))
              field.onChange(e.target.value.replace(/\D/g, ''))
            field.onChange(e.target.value)
          }}
          id={'pixInfo.key'}
          className="mb-6"
          label={'Chave PIX'}
          slotProps={{
            htmlInput: {
              maxLength: getLength(),
            },
          }}
          size="small"
          fullWidth
          error={!!error}
          helperText={error}
          disabled={!editable}
        />
      )}
    />
  )
}
