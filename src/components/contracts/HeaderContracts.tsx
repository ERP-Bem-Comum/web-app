import { ParamsContracts } from '@/types/contracts'
import { InputAdornment, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Control, Controller, FieldErrors } from 'react-hook-form'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { AutoComplete } from '../layout/AutoComplete'
import { Button } from '../ui/button'
import { CardHeader } from '../ui/card'
import { FilterContracts } from './Filters/FiltersContracts'
import { ContractsExportButton } from './tablesComponents/ContractsExportButton'

interface headerPayablesProps {
  control: Control<ParamsContracts>
  errors: FieldErrors<ParamsContracts>
  values: ParamsContracts
  handleFilter: () => void
}

export const HeaderContracts = ({ control, errors, values, handleFilter }: headerPayablesProps) => {
  const router = useRouter()
  const [openFilter, setOpenFilter] = useState(false)

  return (
    <CardHeader>
      <section className="p-4 flex items-center flex-row justify-between">
        <div className="flex items-center w-3/5 gap-3">
          <Button
            size="none"
            variant="erpReturn"
            className="border-[#E0E4E4] me-4"
            onClick={() => setOpenFilter(!openFilter)}
          >
            <BiFilterAlt size={20} color={'#155366'} />
          </Button>
          <Controller
            name={'search'}
            control={control}
            render={({ field }) => (
              <TextField
                id="search"
                name="search"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                label="Pesquise"
                size="small"
                sx={{ backgroundColor: '#fff', width: '392px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BiSearch size={20} color={'#155366'} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <div className="w-[250px]">
            <AutoComplete
              control={control}
              options={[
                { id: 1, name: 'Sim' },
                { id: 0, name: 'Não' },
              ]}
              name="payableParams.agreement"
              label="Acordo de cooperação:"
              editable
              error={errors.payableParams?.budgetPlanId?.message}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="erpPrimary" onClick={() => router.push('/contratos/adicionar')}>
            Novo contrato
          </Button>
          <ContractsExportButton currentParams={values} />
        </div>
      </section>
      <section hidden={!openFilter}>
        <FilterContracts control={control} errors={errors} handleFilter={handleFilter} />
      </section>
    </CardHeader>
  )
}
