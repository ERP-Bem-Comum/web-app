import { Button } from '@/components/ui/button'
import { CardHeader } from '@/components/ui/card'
import { ParamsCreditCard } from '@/types/creditCard'
import { InputAdornment, TextField } from '@mui/material'
import { Control, Controller } from 'react-hook-form'
import { BiSearch } from 'react-icons/bi'

interface CreditCardSearchProps {
  control: Control<ParamsCreditCard>
  onOpen: () => void
}
const CreditCardSearch = ({ control, onOpen }: CreditCardSearchProps) => {
  return (
    <CardHeader>
      <section className="p-4 flex items-center flex-row justify-between">
        <div className="flex items-center">
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
        </div>
        <div>
          <Button data-test="add" variant="erpPrimary" onClick={onOpen}>
            Adicionar Cartão
          </Button>
        </div>
      </section>
    </CardHeader>
  )
}

export { CreditCardSearch }
