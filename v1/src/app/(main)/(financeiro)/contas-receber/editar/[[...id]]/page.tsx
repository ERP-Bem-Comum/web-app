'use client'
import TopPages from '@/components/TopPages'
import FormReceivable from '@/components/receivables/FormReceivable'
import { ReceivableStatus } from '@/enums/receivables'
import { useReceivableContext } from '@/hooks/useReceivableContext'
import { useParams, useRouter } from 'next/navigation'

export default function EditReceivable() {
  const router = useRouter()
  const { id } = useParams()
  const { receivable, setCurrentReceivableId } = useReceivableContext()

  if (id) {
    setCurrentReceivableId(Number(id))
  } else if (!receivable) {
    router.push('/contas-receber')
  }
  return (
    <div className="w-full h-full">
      <TopPages text={'Editar Receita'} path="/contas-receber" />
      {receivable && (
        <FormReceivable
          receivable={{ ...receivable, currentFiles: receivable.files }}
          edit={receivable.receivableStatus === ReceivableStatus.PENDING}
        />
      )}
    </div>
  )
}
