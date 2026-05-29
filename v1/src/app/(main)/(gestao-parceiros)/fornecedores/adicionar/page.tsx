import TopPages from '@/components/TopPages'
import FormSupplier from '@/components/suppliers/FormSupplier'

export default function AddSupplier() {
  return (
    <div className="w-full h-full">
      <TopPages text={'Fornecedor > Adicionar'} />
      <FormSupplier supplier={null} edit={true} />
    </div>
  )
}
