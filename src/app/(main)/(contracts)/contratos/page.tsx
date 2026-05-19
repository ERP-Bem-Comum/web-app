'use client'
import ContractsTable from '@/components/contracts/ContractsTable'
import TopPages from '@/components/TopPages'

export default function Contracts() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text="Contratos" />
      <ContractsTable />
    </div>
  )
}
