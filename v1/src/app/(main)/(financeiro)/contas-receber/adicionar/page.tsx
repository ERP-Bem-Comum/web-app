'use client'
import TopPages from '@/components/TopPages'
import FormReceivable from '@/components/receivables/FormReceivable'

export default function AddReceivable() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Lançar Receita'} path="/contas-receber" />
      <FormReceivable receivable={null} edit={true} />
    </div>
  )
}
