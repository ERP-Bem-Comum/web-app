import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useContracts } from '@/features/contracts/views/hooks/use-contracts'
import { ContractsTable } from '@/features/contracts/views/components/ContractsTable'
import { ContractListFiltersSchema } from '@/features/contracts/domain/schemas'

export const Route = createFileRoute('/_authenticated/contratos/')({
  validateSearch: ContractListFiltersSchema,
  component: ContractsPage,
})

function ContractsPage() {
  const search = Route.useSearch()
  const { data } = useContracts(search)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <a
          href="/contratos/adicionar"
          className="bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium py-2 px-4 rounded-md transition-colors"
        >
          + Novo Contrato
        </a>
      </div>

      <Suspense fallback={<div className="p-4 text-gray-500">Carregando contratos...</div>}>
        <ContractsTable rows={data?.items || []} />
      </Suspense>
    </div>
  )
}
