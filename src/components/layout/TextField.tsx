import { TextField } from '@mui/material'
import { HTMLInputTypeAttribute } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface FilterPickerProps<T extends FieldValues> {
  name: Path<T>
  label: string
  control: Control<T>
  editable: boolean
  currency?: boolean
  error: string | undefined
  maxLength?: number
  type?: HTMLInputTypeAttribute
}

export const CustomTextField = <T extends FieldValues>({
  control,
  name,
  label,
  editable,
  currency = false,
  error,
  maxLength = 40,
  type = 'text',
}: FilterPickerProps<T>) => {
  const formatOnChange = (value: string) => {
    if (currency) return Number(value.replace(/\D/g, '')) / 100
    if (type === 'number') return Number(value.replace(/\D/g, ''))
    return value
  }
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          type={type}
          value={
            currency
              ? (field.value ?? 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : (field.value ?? '')
          }
          onChange={(e) => {
            field.onChange(formatOnChange(e.target.value))
          }}
          slotProps={{ htmlInput: { maxLength, min: 1 } }}
          id={name}
          className="mb-6"
          label={label}
          size="small"
          fullWidth
          error={!!error}
          helperText={error ?? ''}
          disabled={!editable}
        />
      )}
    />
  )
}
