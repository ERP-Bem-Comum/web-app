import { createFileRoute } from '@tanstack/react-router'
import { useContractHistory } from '@/features/contracts/views/hooks/use-contract-history'

export const Route = createFileRoute('/_authenticated/contratos/historico/$id')({
  component: ContractHistoryPage,
})

function ContractHistoryPage() {
  const { id } = Route.useParams()
  const numericId = Number(id)
  const { data: history } = useContractHistory(numericId)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Histórico do Contrato</h1>
      <p className="mt-4 text-gray-600">ID: {id}</p>
      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(history, null, 2)}
      </pre>
    </div>
  )
}
