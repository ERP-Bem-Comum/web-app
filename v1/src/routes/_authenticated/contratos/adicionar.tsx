import { createFileRoute } from '@tanstack/react-router'
import { ContractForm } from '@/features/contracts/views/components/ContractForm'

export const Route = createFileRoute('/_authenticated/contratos/adicionar')({
  component: AddContractPage,
})

function AddContractPage() {
  return (
    <div className="flex flex-col flex-1 w-full min-w-0 h-full overflow-hidden pb-[56px]">
      <ContractForm mode="create" />
    </div>
  )
}
