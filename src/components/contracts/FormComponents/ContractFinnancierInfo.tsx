import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { useOptions } from '@/hooks/useOptions'
import { getFinancierByNameOrCNPJ, IFinancier } from '@/services/financier'
import { maskCNPJ } from '@/utils/masks'
import { Grid } from '@mui/material'
import { debounce } from 'lodash-es'
import { Fragment, useEffect, useState } from 'react'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface ContractFinancierProps {
  editable: boolean
  onFinancierChange: (id: number) => void
  defaultFinancier: Pick<IFinancier, 'id' | 'name' | 'cnpj' | 'address' | 'telephone'> | undefined
  showSearch?: boolean
  onContractorData?: (data: any) => void
}

export const ContractFinancierInfo = ({
  editable,
  onFinancierChange,
  defaultFinancier,
  showSearch,
  onContractorData,
}: ContractFinancierProps) => {
  const [financier, setFinancier] = useState<typeof defaultFinancier>(defaultFinancier)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { options } = useOptions()

  useEffect(() => {
    if (financier?.id) {
      onFinancierChange(financier.id)
      onContractorData?.(financier)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financier])

  const debouncedRefetch = debounce(async (value: string) => {
    const res = await getFinancierByNameOrCNPJ(value)
    if (!res.data && res.status !== 200) {
      setErrorMessage(res.error)
    } else if (res.data) {
      setFinancier(res.data)
    }
  }, 500)

  const handleRefetch = (value: string) => {
    debouncedRefetch(value)
    return () => debouncedRefetch.cancel()
  }

  return (
    <Fragment>
      {showSearch && (
        <div className="mb-2">
          <SearchByCPForCNPJ
            options={options.Financiers()}
            defaultId={financier?.id}
            handleRefetch={handleRefetch}
            label="Buscar nome ou CNPJ"
          />
        </div>
      )}
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Financiador não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
    </Fragment>
  )
}
