import { Switch, SwitchProps } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { TitleLabel } from './TitleLabel'
import { cn } from 'lib/utils'

interface ToggleProps<T extends FieldValues> extends SwitchProps {
  control: Control<T>
  editable: boolean
  name: Path<T>
  label: string
}

export const CustomToggle = <T extends FieldValues>({
  control,
  name,
  editable,
  label,
  className,
  ...rest
}: ToggleProps<T>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field }) => (
        <div className={cn('w-full h-full', className)}>
          <TitleLabel className="text-sm">{label}</TitleLabel>
          <div className="flex">
            <Switch
              {...field}
              id={name}
              checked={field.value ?? false}
              size="small"
              disabled={!editable}
              {...rest}
            />
            <p className="text-[#155366]">{field.value ? 'Sim' : 'Não'}</p>
          </div>
        </div>
      )}
    />
  )
}
