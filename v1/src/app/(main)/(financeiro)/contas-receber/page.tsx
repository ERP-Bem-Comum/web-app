'use client'
import ReceivablesTable from '@/components/receivables/ReceivableTable'
import TopPages from '@/components/TopPages'

export default function Receivables() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text="Contas a Receber" />
      <ReceivablesTable />
    </div>
  )
}
