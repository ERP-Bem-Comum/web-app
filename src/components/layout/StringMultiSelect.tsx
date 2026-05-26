import { Autocomplete, TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface Props<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: string[]
  editable: boolean
  error?: string
  placeholder?: string
}

export const StringMultiSelect = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  editable = true,
  error,
  placeholder,
}: Props<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          id={name as string}
          size="small"
          multiple
          freeSolo={false}
          value={field.value ?? []}
          options={options}
          fullWidth
          onChange={(_event, newValue) => {
            field.onChange(newValue || [])
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!error}
              helperText={error ?? ''}
              placeholder={placeholder}
              fullWidth
            />
          )}
          slotProps={{
            chip: {
              size: 'small',
              sx: {
                backgroundColor: '#e8eef5',
                color: '#2d4f75',
                fontSize: '11px',
                fontWeight: 600,
                height: '22px',
              },
            },
          }}
          disabled={!editable}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px',
              background: '#fff',
              fontSize: '12.5px',
            },
          }}
        />
      )}
    />
  )
}
