'use client'
import ContractsTable from '@/components/contracts/ContractsTable'
import TopPages from '@/components/TopPages'

export default function Contracts() {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col min-w-0">
      <TopPages isReturn={false} text="Contratos" />
      <div className="flex-1 min-h-0 min-w-0">
        <ContractsTable />
      </div>
    </div>
  )
}
