import { FaSearch } from 'react-icons/fa'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Options } from '@/types/global'

type SearchInput = {
  id: number
}

const searchSchema = z.object({
  id: z.number().nullish(),
})

interface SearchAutocompleteProps {
  fnOptions: () => Options[] | undefined
  defaultId?: number
  setSelected: Dispatch<SetStateAction<number | undefined>>
}

export const SearchAutocomplete = ({
  fnOptions,
  defaultId,
  setSelected,
}: SearchAutocompleteProps) => {
  const {
    control,
    watch,
    formState: { errors },
  } = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
  })

  const selected = watch().id
  useEffect(() => {
    if (selected) {
      setSelected(selected)
    }
  }, [selected, setSelected])

  return (
    <div className="relative w-full p-4">
      <AutoComplete
        control={control}
        options={fnOptions()}
        name="id"
        label="Buscar nome da empresa ou CNPJ"
        editable
        error={errors.id?.message}
        aditionalOnChangeBehavior={(id) => {
          setSelected(id as number)
        }}
        hideButtonDropdown
        defaultValue={fnOptions()?.find((op) => op.id === defaultId)}
      />
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
        <FaSearch />
      </div>
    </div>
  )
}
