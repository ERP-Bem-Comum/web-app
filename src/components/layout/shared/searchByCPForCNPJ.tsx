import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v3'
import { AutoComplete } from '../AutoComplete'
import { Options } from '@/types/global'
import { FaSearch } from 'react-icons/fa'
import { useEffect } from 'react'

interface SearchByCPForCNPJProps {
  options: Array<Options> | undefined
  defaultId: number | undefined
  handleRefetch: (value: string) => void
  label?: string
  className?: string
}
type SearchInput = {
  id: number
}
const searchSchema = z.object({
  id: z.number().nullish(),
})
const SearchByCPForCNPJ = ({ options = [], defaultId, handleRefetch, label = 'Buscar nome ou CNPJ', className = '' }: SearchByCPForCNPJProps) => {
  const {
    control,
    reset,
    formState: { errors },
  } = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { id: defaultId },
  })

  const onChange = (newValue: unknown) => {
    const nameOrCNPJ =
      options
        ?.find((op) => op.id === Number(newValue))
        ?.name?.split(' - ')[1]
        .replace(/\D/g, '')
        .trim() ?? ''

    handleRefetch(nameOrCNPJ)
  }

  useEffect(() => {
    reset({ id: defaultId })
  }, [options])

  return (
    <div className={`flex relative w-full align-top search-by-cpfcnpj ${className}`}>
      <AutoComplete
        control={control}
        options={options}
        name="id"
        label={label}
        editable
        error={errors.id?.message}
        hideButtonDropdown
        defaultValue={options.find((op) => op.id === defaultId)}
        aditionalOnChangeBehavior={onChange}
        placeholder={label}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <FaSearch />
      </div>
    </div>
  )
}

export default SearchByCPForCNPJ
