import { maskAgency } from '@/utils/masks'
import { TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface AgencyComponentProps<T extends FieldValues> {
  control: Control<T>
  editable: boolean
  error?: string
  name: Path<T>
  onChange?: (value: string) => void
}

export const AgencyComponent = <T extends FieldValues>({
  control,
  editable,
  error,
  name,
  onChange: externalOnChange,
}: AgencyComponentProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          onChange={(e) => {
            const masked = maskAgency(e.target.value)
            field.onChange(masked)
            externalOnChange?.(masked)
          }}
          id={name}
          className="mb-6"
          label={'Agência - DV'}
          slotProps={{
            htmlInput: {
              maxLength: 6,
            },
            input: {
              value: field.value ?? '',
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
