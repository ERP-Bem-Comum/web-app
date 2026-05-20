/* eslint-disable react-hooks/exhaustive-deps */
import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { PaymentType } from '@/enums/payables'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useGetCollaboratorByNameOrCPF, ICollaborator } from '@/services/collaborator'
import { ContractForAccounts } from '@/types/contracts'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { ModalChangeContract } from '../../modals/financeiro/ModalChangeContract'
import { ModalEditPaymentInfo } from '../../modals/financeiro/ModalEditPaymentInfo'
import { debounce } from '@/utils/debounce'
import SubjectInfo from '../../layout/financeiro/SubjectInfo'
import { UseFormSetValue } from 'react-hook-form'
import { Payable } from '@/types/Payables'
import { useOptions } from '@/hooks/useOptions'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface ContractCollaboratorProps {
  editable: boolean
  setValue: UseFormSetValue<Payable>
  setContract: (contract?: ContractForAccounts) => void
  defaultCollaborator?: ICollaborator
  defaultContract?: ContractForAccounts
  paymentType: PaymentType
  payableId?: number
}

export const PayableCollaboratorInfo = ({
  editable,
  defaultCollaborator,
  defaultContract,
  paymentType,
  payableId,
  setValue,
  setContract,
}: ContractCollaboratorProps) => {
  const [collaborator, setCollaborator] = useState<typeof defaultCollaborator>(defaultCollaborator)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasChanged, setHasChanged] = useState<boolean>(false)
  const [searchByCPForCNPJ, setSearchByCPForCNPJ] = useState<string>('')

  const { refetch } = useGetCollaboratorByNameOrCPF(searchByCPForCNPJ, payableId)
  const { options } = useOptions()

  const paymentInfo = useMemo(() => {
    return {
      bancaryInfo: defaultContract?.bancaryInfo,
      pixInfo: defaultContract?.pixInfo,
    }
  }, [defaultContract])

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

  const handleSetContract = (collaborator: ICollaborator) => {
    if (!collaborator.contracts?.length || collaborator.contracts?.length === 0) {
      setErrorMessage(`Nenhum contrato encontrado para o(a) colaborador(a) ${collaborator.name}.`)
      changeContract(undefined)
      setCollaborator(undefined)
    } else if (paymentType === PaymentType.CONTRACT) {
      setCollaborator(collaborator)
      const firstContract = collaborator.contracts[0]
      changeContract(firstContract)
      setValue('collaboratorId', collaborator.id)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRefetch = useCallback(
    debounce(async () => {
      setHasChanged(true)
      const { data } = await refetch()
      if (!data || data.status !== 200) {
        setErrorMessage(data?.error ?? '')
      } else if (data.data) {
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
          options={options.Collaborators()}
          defaultId={collaborator?.id}
          handleRefetch={handleRefetch}
        />
      )}
      <SubjectInfo
        {...paymentInfo}
        contract={defaultContract}
        editable={editable}
        onOpenModalEditInfo={onOpenModalEditInfo}
        onOpenModalChangeContract={onOpenModalChangeContract}
        paymentType={PaymentType.CONTRACT}
        collaborator={collaborator}
      />
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Colaborador não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
      <ModalEditPaymentInfo
        open={isOpenModalEditInfo}
        onClose={onCloseModalEditInfo}
        paymentInfo={paymentInfo}
        supplier={null}
        contract={defaultContract}
        hasChanged={hasChanged}
        payableId={payableId}
        onRefetch={() => handleRefetch(searchByCPForCNPJ)}
      />
      <ModalChangeContract
        contracts={collaborator?.contracts}
        onClose={onCloseModalChangeContract}
        currentContractId={defaultContract?.id}
        open={isOpenModalChangeContract}
        setContractCallback={(contract) => changeContract(contract)}
      />
    </Fragment>
  )
}
