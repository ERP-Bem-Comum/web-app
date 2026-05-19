import { Autocomplete, Grid, TextField } from '@mui/material'
import { HTMLProps } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface FilterValuePickerProps<T extends FieldValues> extends HTMLProps<HTMLSelectElement> {
  control: Control<T>
}

export const FilterValuePicker = <T extends FieldValues>({
  control,
  name,
  label,
}: FilterValuePickerProps<T>) => {
  const { errors } = control._formState
  const error = errors[name as keyof Path<T>]?.message as string
  const options = [
    {
      id: {
        start: 0,
        end: 2000,
      },
      name: 'Entre 0 e 2000',
    },
    {
      id: {
        start: 2000,
        end: 5000,
      },
      name: 'Entre 2000 e 5000',
    },
    {
      id: {
        start: 5000,
        end: 10000,
      },
      name: 'Entre 5000 e 10000',
    },
    {
      id: {
        start: 10000,
        end: 15000,
      },
      name: 'Entre 10000 e 15000',
    },
    {
      id: {
        start: 15000,
        end: 20000,
      },
      name: 'Entre 15000 e 20000',
    },
  ]
  return (
    <Grid item xs={12 / 5}>
      <Controller
        name={name as Path<T>}
        control={control}
        render={({ field }) => (
          <Autocomplete
            id={name}
            size="small"
            value={options ? options.find((op) => op.id === field.value) : null}
            options={options ?? []}
            getOptionLabel={(option) => option.name}
            onChange={(_event, newValue) => {
              field.onChange(newValue?.id)
            }}
            renderInput={(params) => (
              <TextField {...params} label={label} error={!!error} helperText={error ?? ''} />
            )}
          />
        )}
      />
    </Grid>
  )
}
