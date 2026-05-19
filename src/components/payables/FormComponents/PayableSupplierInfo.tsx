import { PaymentType } from '@/enums/payables'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useGetSupplierByNameOrCNPJ } from '@/services/supplier'
import { ContractForAccounts } from '@/types/contracts'
import { ISupplier } from '@/types/supplier'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { ModalNotFound } from '../../modals/ModalNotFound'
import { ModalChangeContract } from '../../modals/financeiro/ModalChangeContract'
import { ModalEditPaymentInfo } from '../../modals/financeiro/ModalEditPaymentInfo'
import SubjectInfo from '../../layout/financeiro/SubjectInfo'
import { Payable } from '@/types/Payables'
import { debounce } from 'lodash-es'
import { UseFormSetValue } from 'react-hook-form'
import { useOptions } from '@/hooks/useOptions'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface PayableSupplierProps {
  editable: boolean
  setValue: UseFormSetValue<Payable>
  setContract: (contract?: ContractForAccounts) => void
  defaultSupplier?: ISupplier
  defaultContract?: ContractForAccounts
  paymentType: PaymentType
  payableId?: number
}

export const PayableSupplierInfo = ({
  editable,
  defaultSupplier,
  defaultContract,
  paymentType,
  payableId,
  setValue,
  setContract,
}: PayableSupplierProps) => {
  const [supplier, setSupplier] = useState<ISupplier | undefined>(defaultSupplier)
  const [searchByCPForCNPJ, setSearchByCPForCNPJ] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [hasChanged, setHasChanged] = useState<boolean>(false)

  const { refetch } = useGetSupplierByNameOrCNPJ(searchByCPForCNPJ, payableId)
  const { options } = useOptions()

  const paymentInfo = useMemo(() => {
    return defaultContract
      ? {
          bancaryInfo: defaultContract?.bancaryInfo,
          pixInfo: defaultContract?.pixInfo,
        }
      : { bancaryInfo: supplier?.bancaryInfo, pixInfo: supplier?.pixInfo }
  }, [defaultContract, supplier])

  const {
    isOpen: isOpenModalEditInfo,
    onOpen: onOpenModalEditInfo,
    onClose: onCloseModalEditInfo,
  } = useDisclosure()
  const {
    isOpen: isOpenModalChangeContract,
    onOpen: onOpenModalChangeContract,
    onClose: onCloseModalChangeContract,
  } = useDisclosure()

  const changeContract = (contract?: ContractForAccounts) => {
    contract && setValue('paymentType', PaymentType.CONTRACT)
    setContract(contract)
    setValue('contractId', contract?.id)
  }

  const handleSetContract = (supplier: ISupplier) => {
    if (paymentType !== PaymentType.CARDBILL) {
      if (supplier.contracts && supplier.contracts.length > 0) {
        const firstContract = supplier.contracts[0]
        changeContract(firstContract)
      } else {
        setErrorMessage('Nenhum contrato encontrado para este fornecedor.')
        changeContract(undefined)
      }
    }
    setValue('supplierId', supplier.id)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRefetch = useCallback(
    debounce(async () => {
      setHasChanged(true)
      const { data } = await refetch()
      if (!data || data.status !== 200) {
        setErrorMessage(data?.error ?? '')
      } else if (data.data) {
        setSupplier(data.data)
        handleSetContract(data.data)
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
      <SubjectInfo
        {...paymentInfo}
        editable={editable}
        contract={defaultContract}
        onOpenModalEditInfo={onOpenModalEditInfo}
        onOpenModalChangeContract={onOpenModalChangeContract}
        paymentType={paymentType}
        supplier={supplier}
      />
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Fornecedor não encontrado'}
        handleOnClose={() => setErrorMessage('')}
      />
      <ModalEditPaymentInfo
        open={isOpenModalEditInfo}
        onClose={onCloseModalEditInfo}
        onRefetch={async () => {
          const { data } = await refetch()
          setSupplier(data?.data)
        }}
        payableId={payableId}
        supplier={supplier ?? null}
        contract={defaultContract}
        paymentInfo={paymentInfo}
        hasChanged={hasChanged}
      />
      <ModalChangeContract
        contracts={supplier?.contracts}
        onClose={onCloseModalChangeContract}
        currentContractId={defaultContract?.id}
        open={isOpenModalChangeContract}
        setContractCallback={(contract) => changeContract(contract)}
      />
    </Fragment>
  )
}
