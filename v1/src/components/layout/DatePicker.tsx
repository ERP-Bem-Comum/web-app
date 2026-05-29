import { handleDates } from '@/utils/dates'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'
import { HTMLProps } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface CustomDatePickerProps<T extends FieldValues> extends HTMLProps<HTMLSelectElement> {
  control: Control<T>
  name: Path<T>
  editable: boolean
  error: string | undefined
}

export const CustomDatePicker = <T extends FieldValues>({
  control,
  name,
  label,
  editable,
  error,
}: CustomDatePickerProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
          <DatePicker
            label={label}
            openTo="month"
            views={['year', 'month', 'day']}
            value={handleDates(field.value) ?? null}
            onChange={(value) => {
              field.onChange(value)
            }}
            sx={{
              backgroundColor: '#fff',
            }}
            slotProps={{
              textField: {
                id: 'startOfContract',
                size: 'small',
                error: !!error,
                helperText: error,
                fullWidth: true,
              },
            }}
            disabled={!editable}
          />
        </LocalizationProvider>
      )}
    />
  )
}
