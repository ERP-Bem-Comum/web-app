import { Options } from '@/types/global'
import { Autocomplete, TextField } from '@mui/material'
import { isBoolean } from 'lodash-es'
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
  placeholder?: string
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
  placeholder,
}: AutoCompleteProps<T>) => {
  const transformValue = (value: string | boolean | number) => {
    return isBoolean(value) ? Number(value) : value
  }
  const findValue = (value: string | boolean | number) => {
    return options?.find((op) => op.id === transformValue(value)) ?? null
  }
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, onBlur, name: fieldName } }) => (
        <Autocomplete
          id={fieldName}
          size="small"
          multiple={false}
          value={findValue(value)}
          onChange={(_event, newValue) => {
            onChange(newValue?.id ?? null)
            if (aditionalOnChangeBehavior) {
              aditionalOnChangeBehavior(newValue?.id)
            }
          }}
          onBlur={onBlur}
          defaultValue={defaultValue}
          options={options ?? []}
          slotProps={{
            popupIndicator: { style: { display: hideButtonDropdown ? 'none' : 'visible' } },
            clearIndicator: { style: { marginRight: hideButtonDropdown ? 20 : 0 } },
          }}
          fullWidth
          getOptionLabel={(option) => option.name ?? 'NA'}
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
          renderOption={(props, option) => {
            return (
              <li {...props} key={option.id} value={option.id}>
                {option.name}
              </li>
            )
          }}
          disabled={!editable}
        />
      )}
    />
  )
}
