import { createFileRoute } from '@tanstack/react-router'
import { ContractForm } from '@/features/contracts/views/components/ContractForm'

export const Route = createFileRoute('/_authenticated/contratos/adicionar')({
  component: AddContractPage,
})

function AddContractPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Novo Contrato</h1>
      <ContractForm />
    </div>
  )
}
