import { ReceivableType } from '@/enums/receivables'
import { useDisclosure } from '@/hooks/useDisclosure'
import { getFinancierByNameOrCNPJ, IFinancier } from '@/services/financier'
import { ContractForAccounts } from '@/types/contracts'
import { Fragment, useState } from 'react'
import { ModalChangeContract } from '../../modals/financeiro/ModalChangeContract'
import { ModalNotFound } from '../../modals/ModalNotFound'
import { defaultAccounts } from '../consts'
import SearchByCPForCNPJ from '../../layout/shared/searchByCPForCNPJ'
import { debounce } from '@/utils/debounce'
import SubjectInfo from '../../layout/financeiro/SubjectInfo'
import { Receivable } from '@/types/receivables'
import { UseFormSetValue } from 'react-hook-form'
import { useOptions } from '@/hooks/useOptions'

interface ReceivableFinancierProps {
  editable: boolean
  setValue: UseFormSetValue<Receivable>
  setContract: (contract?: ContractForAccounts) => void
  defaultFinancier?: IFinancier
  defaultContract?: ContractForAccounts
  account?: keyof typeof defaultAccounts
  receivableType: ReceivableType
}

export const ReceivableFinancierInfo = ({
  editable,
  defaultFinancier,
  defaultContract,
  receivableType,
  setValue,
  setContract,
}: ReceivableFinancierProps) => {
  const [financier, setFinancier] = useState<IFinancier | undefined>(defaultFinancier)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { options } = useOptions()

  const {
    isOpen: isOpenModalChangeContract,
    onOpen: onOpenModalChangeContract,
    onClose: onCloseModalChangeContract,
  } = useDisclosure()

  const changeContract = (contract?: ContractForAccounts) => {
    contract && setValue('receivableType', ReceivableType.CONTRACT)
    setContract(contract)
    setValue('contractId', contract?.id)
  }

  const handleSetFinancierAndContract = (financier: IFinancier) => {
    setFinancier(() => {
      if (receivableType === ReceivableType.CONTRACT) {
        const firstContract = financier.contracts[0]
        changeContract(firstContract)
      }
      if (!financier.contracts?.length || financier.contracts.length === 0) {
        setErrorMessage('Nenhum contrato encontrado para este financiador')
        changeContract(undefined)
      }

      setValue('financierId', financier.id)
      return financier
    })
  }

  const debouncedRefetch = debounce(async (value: string) => {
    const res = await getFinancierByNameOrCNPJ(value)
    if (!res.data && res.status !== 200) {
      setErrorMessage(res.error)
    } else if (res.data) {
      handleSetFinancierAndContract(res.data)
    }
  }, 500)

  const handleRefetch = (value: string) => {
    debouncedRefetch(value)
    return () => debouncedRefetch.cancel()
  }

  return (
    <Fragment>
      {editable && (
        <SearchByCPForCNPJ
          options={options.Financiers()}
          defaultId={defaultFinancier?.id}
          handleRefetch={handleRefetch}
        />
      )}
      <SubjectInfo
        contract={defaultContract}
        editable={editable}
        onOpenModalChangeContract={onOpenModalChangeContract}
        financier={financier}
        receivableType={receivableType}
      />
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Financiador não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
      <ModalChangeContract
        contracts={financier?.contracts}
        onClose={onCloseModalChangeContract}
        currentContractId={defaultContract?.id}
        open={isOpenModalChangeContract}
        setContractCallback={(contract) => changeContract(contract)}
      />
    </Fragment>
  )
}
