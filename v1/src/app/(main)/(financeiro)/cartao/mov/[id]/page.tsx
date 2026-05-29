'use client'
import MovTable from '@/components/creditCard/MovTable'
import TopPages from '@/components/TopPages'
import { useParams } from 'next/navigation'

export default function CreditCardMov() {
  const { id } = useParams()
  return (
    <div className="w-full h-full overflow-auto">
      <TopPages isReturn={true} text="Cartões" path="/cartao" />
      <MovTable id={Number(id)} />
    </div>
  )
}
