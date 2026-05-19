'use client'
import TopPages from '@/components/TopPages'
import FormContract from '@/components/contracts/FormContracts'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { ContractStatus } from '@/enums/contracts'
import { useGetContractById } from '@/services/contracts'
import { IContract } from '@/types/contracts'
import { handleDates } from '@/utils/dates'
import { useParams } from 'next/navigation'

export default function EditPayable() {
  const { id } = useParams()
  const { data, isLoading } = useGetContractById(Number(id))
  const contract = {
    ...data?.data,
    contractPeriod: {
      start: handleDates(data?.data?.contractPeriod.start) ?? data?.data?.contractPeriod.start,
      end: handleDates(data?.data?.contractPeriod.end) ?? data?.data?.contractPeriod.end,
    },
  } as IContract

  const isEditable = () => {
    if (contract?.children && contract.children.length > 0) {
      return contract.children[0].contractStatus === ContractStatus.PENDING
    }
    return contract?.contractStatus === ContractStatus.PENDING
  }

  return (
    <div className="w-full h-full ">
      <TopPages text={'Editar contrato'} path="/contratos" />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FormContract
          contract={contract ? { ...contract, currentFiles: contract?.files ?? [] } : undefined}
          edit={isEditable()}
        />
      )}
    </div>
  )
}
