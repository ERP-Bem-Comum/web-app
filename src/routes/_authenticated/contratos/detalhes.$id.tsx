import { createFileRoute } from '@tanstack/react-router'
import { useContract } from '@/features/contracts/views/hooks/use-contract'

export const Route = createFileRoute('/_authenticated/contratos/detalhes/$id')({
  component: ContractDetailsPage,
})

function ContractDetailsPage() {
  const { id } = Route.useParams()
  const numericId = Number(id)
  const { data: contract } = useContract(numericId)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalhes do Contrato</h1>
      <div className="mt-6 bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <span className="text-sm text-gray-500">Código</span>
          <p className="font-medium">{contract?.contractCode}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Objeto</span>
          <p className="font-medium">{contract?.object}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Tipo</span>
          <p className="font-medium">{contract?.contractType}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Status</span>
          <p className="font-medium">{contract?.contractStatus}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Valor Total</span>
          <p className="font-medium">
            {contract?.totalValue?.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Fornecedor</span>
          <p className="font-medium">{contract?.supplier?.name || '-'}</p>
        </div>
      </div>
    </div>
  )
}
