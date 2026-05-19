import { styled } from '@mui/material/styles'
import { DatePicker, LocalizationProvider, PickerDay, PickerDayProps } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'
import { HTMLProps, useCallback, useState } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface YearPickerProps<T extends FieldValues> extends HTMLProps<HTMLSelectElement> {
  control: Control<T>
  field?: Path<T>
  editable?: boolean
  error?: string
  width?: string
  clearable?: boolean
}

export const YearPicker = <T extends FieldValues>({
  control,
  label,
  field = 'dueBetween' as Path<T>,
  editable = true,
  error,
  width = '100',
  clearable = true,
  disabled,
}: YearPickerProps<T>) => {
  const [datePickerRef, setDatePickerRef] = useState<HTMLInputElement | null>(null)
  const getDatePickerRef = useCallback((node: HTMLInputElement) => {
    if (node && !datePickerRef) {
      setDatePickerRef(node)
    }
  }, [])

  return (
    <Controller
      name={field}
      control={control}
      render={({ field }) => {
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
            <DatePicker
              views={['year']}
              label={label}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              disabled={disabled || !editable}
              inputRef={getDatePickerRef}
              sx={{
                width: width + '%',
                padding: 0,
              }}
              disableFuture
              minDate={new Date('2020-01-01')}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  disabled: true,
                  InputProps: {
                    typeof: 'text',
                    sx: {
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: editable ? 'black' : '',
                      },
                    },
                  },
                  InputLabelProps: {
                    shrink: !!field.value,
                  },
                  helperText: error,
                },
                popper: {
                  keepMounted: true,
                  disablePortal: true,
                  anchorEl: datePickerRef,
                },
              }}
            />
          </LocalizationProvider>
        )
      }}
    />
  )
}
