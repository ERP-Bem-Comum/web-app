'use client'
import PayablesTable from '@/components/payables/PayablesTable'
import TopPages from '@/components/TopPages'

export default function Payables() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text="Contas a Pagar" />
      <PayablesTable />
    </div>
  )
}
