import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/detalhes/$id')({
  component: ContractDetailsPage,
})

function ContractDetailsPage() {
  const { id } = Route.useParams()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalhes do Contrato</h1>
      <p className="mt-4 text-gray-600">ID: {id}</p>
    </div>
  )
}
