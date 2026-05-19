'use client'
import BankAccountTable from '@/components/bank-account/BankAccountTable'
import TopPages from '@/components/TopPages'

export default function BankAccounts() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text="Contas Bancárias" />
      <BankAccountTable />
    </div>
  )
}
