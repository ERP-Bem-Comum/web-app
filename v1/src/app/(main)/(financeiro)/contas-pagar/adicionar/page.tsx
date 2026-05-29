'use client'
import TopPages from '@/components/TopPages'
import FormPayable from '@/components/payables/FormPayable'

export default function AddPayable() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Lançar Despesa'} path="/contas-pagar" />
      <FormPayable payable={null} edit={true} />
    </div>
  )
}
