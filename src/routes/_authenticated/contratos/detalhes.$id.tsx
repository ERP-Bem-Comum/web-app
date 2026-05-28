import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useContract } from '@/features/contracts/views/hooks/use-contract'
import { ContractDetail } from '@/features/contracts/views/components/ContractDetail'

export const Route = createFileRoute('/_authenticated/contratos/detalhes/$id')({
  component: ContractDetailsPage,
})

function ContractDetailsPage() {
  const { id } = Route.useParams()
  const numericId = Number(id)

  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 w-full min-w-0 h-full items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#32C6F4] border-t-transparent rounded-full animate-spin" />
          <span className="mt-3 text-[13px] text-[#999187]">Carregando detalhes...</span>
        </div>
      }
    >
      <ContractDetailLoader id={numericId} />
    </Suspense>
  )
}

function ContractDetailLoader({ id }: { id: number }) {
  const { data: contract } = useContract(id)
  if (!contract) {
    return (
      <div className="flex flex-col flex-1 w-full min-w-0 h-full items-center justify-center">
        <p className="text-[15px] font-medium text-[#1f1c1a]">Contrato não encontrado</p>
        <p className="text-[12px] text-[#999187] mt-1">Verifique o número e tente novamente.</p>
      </div>
    )
  }
  return <ContractDetail contract={contract} />
}
