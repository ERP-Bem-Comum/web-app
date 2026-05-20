import { Options } from '@/types/global'
import { Autocomplete, Chip, TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface AutoCompleteProps<T extends FieldValues> {
  control: Control<T>
  options: Array<Options> | undefined
  name: Path<T>
  label: string
  editable: boolean
  error?: string
  defaultValue?: Options
  aditionalOnChangeBehavior?: (newValue: unknown) => void
  hideButtonDropdown?: boolean
}
// teste commit

export const AutoComplete = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  editable = true,
  error,
  defaultValue,
  aditionalOnChangeBehavior,
  hideButtonDropdown = false,
}: AutoCompleteProps<T>) => {
  const transformValue = (value: string | boolean | number) => {
    return typeof value === 'boolean' ? Number(value) : value
  }
  const findValue = (value: string | boolean | number) => {
    return options?.find((op) => op.id === transformValue(value)) ?? null
  }
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          {...field}
          id={name as string}
          size="small"
          multiple={false}
          value={findValue(field.value)}
          defaultValue={defaultValue}
          options={options ?? []}
          slotProps={{
            popupIndicator: { style: { display: hideButtonDropdown ? 'none' : 'visible' } },
            clearIndicator: { style: { marginRight: hideButtonDropdown ? 20 : 0 } },
          }}
          fullWidth
          getOptionLabel={(option) => option.name ?? 'NA'}
          onChange={(_event, newValue) => {
            field.onChange(newValue?.id ?? null)
            aditionalOnChangeBehavior && aditionalOnChangeBehavior(newValue?.id)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!error}
              helperText={error ?? ''}
              fullWidth
            />
          )}
          renderOption={(props, option) => {
            return (
              <li {...props} key={option.id} value={option.id}>
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
