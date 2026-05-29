import { ParamsPayables } from '@/types/Payables'
import { InputAdornment, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Control, Controller, FieldErrors, UseFormWatch } from 'react-hook-form'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { Button } from '../ui/button'
import { CardHeader } from '../ui/card'
import { FilterPayables } from './Filters/FiltersPayables'
import { PayablesExportButton } from './PayablesTableComponents/PayablesExportButton'
import { OutlineButton } from '../layout/Buttons/OutlineButton'
import { useSession } from 'next-auth/react'
interface headerPayablesProps {
  control: Control<ParamsPayables>
  watch: UseFormWatch<ParamsPayables>
  errors: FieldErrors<ParamsPayables>
  onExportCNAB: () => Promise<void>
  handleFilter: () => void
  onOpenApproveModal: () => void
}

export const HeaderPayables = ({
  control,
  watch,
  errors,
  onExportCNAB,
  handleFilter,
  onOpenApproveModal,
}: headerPayablesProps) => {
  const router = useRouter()
  const { data: session } = useSession()
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
        <div className="flex flex-end gap-5">
          <PayablesExportButton currentParams={watch()} onExportCNAB={onExportCNAB} />
          <Button
            variant="erpPrimary"
            onClick={() => router.push('/contas-pagar/lancar-despesas')}
          >
            Lançar Despesa
          </Button>
          {session?.user.massApprovalPermission && (
            <OutlineButton onClick={onOpenApproveModal} label="Aprovar" disabled={false} />
          )}
        </div>
      </section>
      <section hidden={!openFilter}>
        <FilterPayables control={control} errors={errors} handleFilter={handleFilter} />
      </section>
    </CardHeader>
  )
}
