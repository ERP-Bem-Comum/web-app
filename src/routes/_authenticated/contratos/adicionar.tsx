import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/contratos/adicionar')({
  component: AddContractPage,
})

function AddContractPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Novo Contrato</h1>
      <p className="mt-4 text-gray-600">Formulário de criação de contrato (em desenvolvimento).</p>
    </div>
  )
}
