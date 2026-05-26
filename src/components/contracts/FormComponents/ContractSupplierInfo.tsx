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
  showSearch?: boolean
  onContractorData?: (data: any) => void
}

export const ContractSupplierInfo = ({
  editable,
  onSupplierChange,
  defaultSupplier,
  bancaryDataCallback,
  showSearch,
  onContractorData,
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
      onContractorData?.(supplier)
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
      {showSearch && (
        <div className="mb-2">
          <SearchByCPForCNPJ
            options={options.Suppliers()}
            defaultId={supplier?.id}
            handleRefetch={handleRefetch}
            label="Buscar nome ou CNPJ"
          />
        </div>
      )}
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Fornecedor não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
    </Fragment>
  )
}
