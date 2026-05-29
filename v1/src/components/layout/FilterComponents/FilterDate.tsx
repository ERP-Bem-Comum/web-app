import { formatDate } from '@/utils/dates'
import { styled } from '@mui/material/styles'
import { DatePicker, LocalizationProvider, PickerDay, PickerDayProps } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { isAfter, isBefore, isSameDay } from 'date-fns'
import { ptBR as brLocale } from 'date-fns/locale'
import { HTMLProps, useCallback, useState } from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface FilterPickerProps<T extends FieldValues> extends HTMLProps<HTMLSelectElement> {
  control: Control<T>
  field?: Path<T>
  editable?: boolean
  error?: string
  width?: string
  clearable?: boolean
}

export const FilterDate = <T extends FieldValues>({
  control,
  label,
  field = 'dueBetween' as Path<T>,
  editable = true,
  error,
  width = '100',
  clearable = true,
  disabled,
}: FilterPickerProps<T>) => {
  const [datesPicked, setDatesPicked] = useState<number>(0)
  const [datePickerRef, setDatePickerRef] = useState<HTMLInputElement | null>(null)
  const getDatePickerRef = useCallback((node: HTMLInputElement) => {
    if (node && !datePickerRef) {
      setDatePickerRef(node)
    }
  }, [])
  interface CustomPickerDayProps extends PickerDayProps<Date> {
    isSelected: boolean
    start: Date | null
    end: Date | null
  }

  const CustomPickerDay = styled(PickerDay, {
    shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'start' && prop !== 'end',
  })<CustomPickerDayProps>(({ isSelected, day, start, end }) => ({
    borderRadius: 0,
    ...(isSelected && {
      backgroundColor: 'red',
      color: 'black',
      '&:hover, &:focus': {
        backgroundColor: 'blue',
      },
    }),
    ...(isSameDay(day, start ?? -1) && {
      borderTopLeftRadius: '50%',
      borderBottomLeftRadius: '50%',
    }),
    ...(isSameDay(day, end ?? -1) && {
      borderTopRightRadius: '50%',
      borderBottomRightRadius: '50%',
    }),
    position: 'sticky',
  })) as React.ComponentType<CustomPickerDayProps>

  const isBetween = (dayA: Date, start: Date | null | undefined, end: Date | null | undefined) => {
    if (start == null || end == null) {
      return false
    }

    return isBefore(dayA, end) && isAfter(dayA, start)
  }

  const CustomDayComponent = (props: PickerDayProps<Date>) => {
    const { day, start, end, ...other } = props as CustomPickerDayProps

    const isSelected =
      isSameDay(day, start ?? -1) || isSameDay(day, end ?? -1) || isBetween(day, start, end)

    return (
      <CustomPickerDay
        {...other}
        day={day}
        start={start}
        end={end}
        disableMargin
        selected={isSelected}
      />
    )
  }

  const formatDefaultValueTextField = (start: Date | undefined, end: Date | undefined) => {
    if (start === undefined) {
      return ''
    }
    const startFormatted = formatDate(start)
    const endFormatted = formatDate(end)

    if (end === undefined) {
      return startFormatted
    }

    return `${startFormatted} - ${endFormatted}`
  }

  const datePicked = (value?: Date, data?: { start: Date; end: Date }) => {
    if (value) {
      if (datesPicked % 2 !== 0) {
        if (data?.start && isBefore(value, data.start)) {
          return { start: value, end: value }
        }
        setDatesPicked(datesPicked + 1)
        return { start: data?.start, end: value }
      } else {
        setDatesPicked(datesPicked + 1)
        return { start: value, end: value }
      }
    }
  }

  return (
    <Controller
      name={field}
      control={control}
      render={({ field }) => {
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
            <DatePicker
              label={label}
              openTo="month"
              views={['year', 'month', 'day']}
              disabled={disabled || !editable}
              inputRef={getDatePickerRef}
              sx={{
                width: width + '%',
              }}
              closeOnSelect={false}
              onChange={(value) => {
                field.onChange(datePicked(value ?? undefined, field.value))
              }}
              slots={{
                day: CustomDayComponent,
              }}
              slotProps={{
                field: {
                  onClear: () => {
                    setDatesPicked(0)
                    field.onChange({ start: undefined, end: undefined })
                  },
                  clearable: clearable && !disabled,
                },
                day: {
                  start: field.value?.start ?? null,
                  end: field.value?.end ?? null,
                } as never,
                textField: {
                  size: 'small',
                  fullWidth: true,
                  disabled: true,
                  InputProps: {
                    typeof: 'text',
                    value: formatDefaultValueTextField(field.value?.start, field.value?.end),
                    sx: {
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: editable ? 'black' : '',
                      },
                    },
                  },
                  InputLabelProps: {
                    shrink: !!field.value?.start,
                  },
                  helperText: error,
                },
                popper: {
                  keepMounted: true,
                  disablePortal: true,
                  anchorEl: datePickerRef,
                },
              }}
              selectedSections={1}
            />
          </LocalizationProvider>
        )
      }}
    />
  )
}
