import { InputAdornment, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Control, Controller, FieldErrors, UseFormWatch } from 'react-hook-form'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { Button } from '../ui/button'
import { CardHeader } from '../ui/card'
import { FilterReceivable } from './Filters/FiltersReceivable'
import { ParamsReceivables } from '@/types/receivables'
import { ReceivablesExportButton } from './ReceivablesTableComponents/ReceivablesExportButton'

interface headerPayablesProps {
  control: Control<ParamsReceivables>
  watch: UseFormWatch<ParamsReceivables>
  errors: FieldErrors<ParamsReceivables>
  handleFilter: () => void
}

export const HeaderReceivables = ({
  control,
  watch,
  errors,
  handleFilter,
}: headerPayablesProps) => {
  const router = useRouter()
  const [openFilter, setOpenFilter] = useState(false)

  return (
    <CardHeader>
      <section className="p-4 flex items-center flex-row justify-between">
        <div className="flex items-center">
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
                sx={{ backgroundColor: '#fff', width: 392 }}
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
        </div>
        <div>
          <ReceivablesExportButton currentParams={watch()} />
          <Button variant="erpPrimary" onClick={() => router.push('/contas-receber/adicionar')}>
            Lançar Receita
          </Button>
        </div>
      </section>
      <section hidden={!openFilter}>
        <FilterReceivable control={control} errors={errors} handleFilter={handleFilter} />
      </section>
    </CardHeader>
  )
}
