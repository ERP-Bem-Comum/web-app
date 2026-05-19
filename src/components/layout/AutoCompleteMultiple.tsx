import { Options } from '@/types/global'
import { Autocomplete, Chip, TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface AutoCompleteProps<T extends FieldValues> {
  control: Control<T>
  options: Array<Options> | null
  name: Path<T>
  label: string
  editable: boolean
  error: string | undefined
}

export const AutoCompleteMultiple = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  editable = true,
  error,
}: AutoCompleteProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          id={name as string}
          size="small"
          multiple
          value={options?.filter((op) => field.value?.includes(op.id)) ?? []}
          options={options ?? []}
          fullWidth
          getOptionLabel={(option) => option.name ?? 'NA'}
          onChange={(_event, newValue) => {
            field.onChange(newValue.map((val) => val.id) || [])
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              key={params.id}
              label={label}
              error={!!error}
              helperText={error ?? ''}
              fullWidth
            />
          )}
          renderOption={(props, option) => {
            return (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )
          }}
          renderTags={(tagValue, getTagProps) => {
            return tagValue.map((option, index) => (
              <Chip size="small" {...getTagProps({ index })} key={option.id} label={option.name} />
            ))
          }}
          disabled={!editable}
        />
      )}
    />
  )
}
