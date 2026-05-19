'use client'
import TopPages from '@/components/TopPages'
import FormContract from '@/components/contracts/FormContracts'

export default function AddContract() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Lançar Contrato'} path="/contratos" />
      <FormContract edit={true} />
    </div>
  )
}
