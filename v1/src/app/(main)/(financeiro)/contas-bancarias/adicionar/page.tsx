import TopPagesWithArrow from '@/components/TopPagesWithArrow'
import FormBankAccount from '@/components/bank-account/FormBankAccount'

export default function AddAccount() {
  return (
    <div className="w-full h-full">
      <TopPagesWithArrow text={'Conta Bancária'} nextText="Adicionar" />
      <FormBankAccount account={null} />
    </div>
  )
}
