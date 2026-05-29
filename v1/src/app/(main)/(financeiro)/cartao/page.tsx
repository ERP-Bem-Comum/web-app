'use client'
import CreditCardTable from '@/components/creditCard/CreditCardTable'
import TopPages from '@/components/TopPages'

export default function CreditCard() {
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={false} text="Cartões" />
      <CreditCardTable />
    </div>
  )
}
