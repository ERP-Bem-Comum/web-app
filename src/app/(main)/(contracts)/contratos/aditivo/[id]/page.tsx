'use client'
import TopPages from '@/components/TopPages'
import FormContract from '@/components/contracts/FormContracts'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { useGetContractById } from '@/services/contracts'
import { IContract } from '@/types/contracts'
import { handleDates } from '@/utils/dates'
import { useParams } from 'next/navigation'

export default function CreateAditive() {
  const { id } = useParams()
  const { data, isLoading } = useGetContractById(Number(id))
  const contract = {
    ...data?.data,
    contractPeriod: {
      start: handleDates(data?.data?.contractPeriod.start) ?? data?.data?.contractPeriod.start,
      end: handleDates(data?.data?.contractPeriod.end) ?? data?.data?.contractPeriod.end,
    },
  } as IContract

  return (
    <div className="w-full h-full">
      <TopPages text={'Adicionar aditivo'} path="/contratos" />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FormContract contract={contract} edit={true} parentId={contract?.id} />
      )}
    </div>
  )
}
