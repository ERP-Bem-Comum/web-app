import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { useOptions } from '@/hooks/useOptions'
import { useGetSupplierByNameOrCNPJ } from '@/services/supplier'
import { BancaryInfo, PixInfo } from '@/types/global'
import { ISupplier } from '@/types/supplier'
import { maskCNPJ } from '@/utils/masks'
import { Grid } from '@mui/material'
import { debounce } from 'lodash-es'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface ContractSupplierProps {
  editable: boolean
  onSupplierChange: (id: number) => void
  bancaryDataCallback: (pix: Required<PixInfo>, account: Required<BancaryInfo>) => void
  defaultSupplier:
    | Pick<
        ISupplier,
        'name' | 'id' | 'cnpj' | 'serviceCategory' | 'fantasyName' | 'pixInfo' | 'bancaryInfo'
      >
    | undefined
}

export const ContractSupplierInfo = ({
  editable,
  onSupplierChange,
  defaultSupplier,
  bancaryDataCallback,
}: ContractSupplierProps) => {
  const [supplier, setSupplier] = useState<typeof defaultSupplier>(defaultSupplier)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchByCPForCNPJ, setSearchByCPForCNPJ] = useState<string>('')

  const { refetch } = useGetSupplierByNameOrCNPJ(searchByCPForCNPJ)
  const { options } = useOptions()
  const isMounted = useRef(false)

  useEffect(() => {
    if (supplier?.id && isMounted.current) {
      onSupplierChange(supplier.id)
      bancaryDataCallback(
        supplier.pixInfo ?? { key_type: '', key: '' },
        supplier.bancaryInfo ?? {
          accountNumber: '',
          agency: '',
          bank: '',
          dv: '',
        },
      )
    } else {
      isMounted.current = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRefetch = useCallback(
    debounce(async () => {
      const { data } = await refetch()
      if (!data || data.status !== 200) {
        setErrorMessage(data?.error ?? '')
      } else if (data.data) {
        setSupplier(data.data)
      }
    }, 500),
    [],
  )

  const handleRefetch = useCallback(
    async (newValue: string) => {
      setSearchByCPForCNPJ(newValue)
      debouncedRefetch()
    },
    [debouncedRefetch, setSearchByCPForCNPJ],
  )

  return (
    <Fragment>
      {editable && (
        <SearchByCPForCNPJ
          options={options.Suppliers()}
          defaultId={supplier?.id}
          handleRefetch={handleRefetch}
        />
      )}
      <Grid item xs={12} className="flex">
        <div className="w-full h-full p-3 ">
          <h1 className="font-black mb-2">Fornecedor:</h1>
          <p>Nome: {supplier?.name}</p>
          <p>Fome fantasia: {supplier?.fantasyName}</p>
          <p>CNPJ: {maskCNPJ(supplier?.cnpj ?? '')}</p>
          <p>Categoria do serviço: {supplier?.serviceCategory}</p>
        </div>
      </Grid>
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Fornecedor não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
    </Fragment>
  )
}
