'use client'
import { Autocomplete, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  disabledList,
  educationList,
  genderList,
  programList,
  raceList,
  roleList,
  statusList,
} from '@/utils/enums'
import { Button } from '@/components/ui/button'

interface TeamReportsFilterProps {
  openFilter: boolean
  onFilter: (data: any) => void
  onExport: () => void
  onCharts: () => void
  openCharts: boolean
}

export const TeamReportsFilter = ({
  openFilter,
  onFilter,
  onExport,
  onCharts,
  openCharts,
}: TeamReportsFilterProps) => {
  const { control, handleSubmit, watch, setValue } = useForm()
  const selectedPrograms = watch('program')
  const [listRoles, setListRoles] = useState<string[]>([])

  useEffect(() => {
    const roles = selectedPrograms?.flatMap((program: string) => roleList[program] || [])
    setListRoles(roles || [])
  }, [selectedPrograms, setValue])

  if (!openFilter) return null

  return (
    <div className="bg-[#F6FAFB] grid gap-4 grid-cols-7 p-4 w-full">
      {/* Education */}
      <Controller
        name="education"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={Object.keys(educationList)}
            getOptionLabel={(option) => educationList[option]}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Escolaridade"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      {/* Race */}
      <Controller
        name="race"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={Object.keys(raceList)}
            getOptionLabel={(option) => raceList[option]}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Raça" size="small" sx={{ backgroundColor: '#fff' }} />
            )}
          />
        )}
      />

      {/* Year */}
      <Controller
        name="year"
        control={control}
        render={({ field }) => (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
            <DatePicker
              label="Ano de Contrato"
              views={['year']}
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  sx: { backgroundColor: '#fff' },
                },
              }}
            />
          </LocalizationProvider>
        )}
      />

      {/* Disabled */}
      <Controller
        name="disabled"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={Object.keys(disabledList)}
            getOptionLabel={(option) => disabledList[option]}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Desativado por"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      {/* Program */}
      <Controller
        name="program"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={programList}
            value={field.value}
            onChange={(_, newValue) => {
              field.onChange(newValue)
              setValue('role', [])
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Programa"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      {/* Role */}
      <Controller
        name="role"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            disabled={!selectedPrograms?.length}
            options={listRoles}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Função" size="small" sx={{ backgroundColor: '#fff' }} />
            )}
          />
        )}
      />

      {/* Gender */}
      <Controller
        name="gender"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={Object.keys(genderList)}
            getOptionLabel={(option) => genderList[option]}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Identidade de Gênero"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      {/* Status */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Autocomplete
            options={['Ativo', 'Inativo']}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Status" size="small" sx={{ backgroundColor: '#fff' }} />
            )}
          />
        )}
      />

      {/* Situation */}
      <Controller
        name="situation"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={Object.keys(statusList)}
            getOptionLabel={(option) => statusList[option]}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Situação Cadastral"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      {/* Age */}
      <Controller
        name="age"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Idade"
            type="number"
            size="small"
            fullWidth
            InputProps={{ inputProps: { min: 1, max: 100 } }}
            sx={{ backgroundColor: '#fff' }}
          />
        )}
      />

      {/* Employment */}
      <Controller
        name="employment"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={['CLT', 'PJ']}
            value={field.value}
            onChange={(_, newValue) => field.onChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vínculo Empregatício"
                size="small"
                sx={{ backgroundColor: '#fff' }}
              />
            )}
          />
        )}
      />

      <Button variant="erpSecondary" onClick={handleSubmit(onFilter)}>
        Filtrar
      </Button>
      <Button variant="erpSecondary" onClick={onExport}>
        Exportar
      </Button>
      <Button variant="erpSecondary" onClick={onCharts}>
        {openCharts ? 'Tabela' : 'Gráficos'}
      </Button>
    </div>
  )
}
