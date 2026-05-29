import { createFileRoute } from '@tanstack/react-router'
import { ContractForm } from '@/features/contracts/views/components/ContractForm'
import { useContract } from '@/features/contracts/views/hooks/use-contract'

export const Route = createFileRoute('/_authenticated/contratos/editar/$id')({
  component: EditContractPage,
})

function EditContractPage() {
  const { id } = Route.useParams()
  const { data: contract, isLoading } = useContract(id)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Contrato</h1>
      {contract ? <ContractForm initialData={contract} /> : <p className="text-gray-500">Contrato não encontrado.</p>}
    </div>
  )
}
