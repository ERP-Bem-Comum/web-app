import { Options } from '@/types/global'
import { Autocomplete, TextField } from '@mui/material'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { useMassApprover } from '@/hooks/useMassApprover'
import { useEffect } from 'react'

interface AutoCompleteMultipleWithMassApproverProps<T extends FieldValues> {
  control: Control<T>
  options: Array<Options> | null
  name: Path<T>
  label: string
  editable: boolean
  error: string | undefined
}

export const AutoCompleteMultipleWithMassApprover = <T extends FieldValues>({
  control,
  name,
  label,
  options,
  editable = true,
  error,
}: AutoCompleteMultipleWithMassApproverProps<T>) => {
  const { data: massApprovers } = useMassApprover()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const currentValue = options?.filter((op) => field.value?.includes(op.id)) ?? []
        const massApproverOptions = massApprovers ? 
          massApprovers.map(massApprover => options?.find(op => op.id === massApprover.id)).filter(Boolean) : []
        
        // Garantir que todos os aprovadores em massa estejam na lista
        useEffect(() => {
          if (massApproverOptions.length > 0 && editable) {
            const currentIds = currentValue.map(val => val.id)
            const massApproverIds = massApproverOptions.map(option => option.id)
            
            const missingMassApprovers = massApproverOptions.filter(option => 
              !currentIds.includes(option.id)
            )
            
            if (missingMassApprovers.length > 0) {
              const newValue = [...missingMassApprovers, ...currentValue]
              field.onChange(newValue.map((val) => val.id) || [])
            }
          }
        }, [massApproverOptions, editable, currentValue, field])
        
        return (
          <Autocomplete
            id={name as string}
            size="small"
            multiple
            value={currentValue}
            options={options ?? []}
            fullWidth
            getOptionLabel={(option) => option.name ?? 'NA'}
            onChange={(_event, newValue) => {
              if (massApproverOptions.length > 0) {
                const currentIds = newValue.map(val => val.id)
                const missingMassApprovers = massApproverOptions.filter(option => 
                  !currentIds.includes(option.id)
                )
                
                if (missingMassApprovers.length > 0) {
                  newValue = [...missingMassApprovers, ...newValue]
                }
              }
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
            slotProps={{ chip: { size: 'small' } }}
            disabled={!editable}
          />
        )
      }}
    />
  )
}
