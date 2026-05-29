import { ModalAlert } from '@/components/modals/ModalAlert'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import { usePayableContext } from '@/hooks/usePayableContext'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'

interface PayableModalsProps {
  identifierCode?: string
  hasPayable: boolean
  id?: number
}

export const PayableModals = ({ identifierCode, hasPayable, id }: PayableModalsProps) => {
  const router = useRouter()
  const {
    success,
    errorMessage,
    onDelete,
    operationType,
    disclosure: { modalAlertDisclosure, modalConfirmDisclosure, modalQuestionDisclosure },
  } = usePayableContext()

  const getSuccessMessage = () => {
    if (!success) return errorMessage
    
    switch (operationType) {
      case 'delete':
        return 'Pagamento deletado com sucesso!'
      case 'edit':
        return 'Pagamento editado com sucesso!'
      case 'create':
        return 'Pagamento programado com sucesso!'
      default:
        return 'Operação realizada com sucesso!'
    }
  }

  return (
    <Fragment>
      <ModalConfirm
        open={modalConfirmDisclosure.isOpen}
        onClose={() => {
          modalConfirmDisclosure.onClose()
          modalAlertDisclosure.onClose()
          success && router.push('/contas-pagar')
        }}
        text={getSuccessMessage()}
        success={success}
      />
      <ModalQuestion
        open={modalQuestionDisclosure.isOpen}
        onConfirm={() => {
          router.push('/contas-pagar')
          modalQuestionDisclosure.onClose()
        }}
        onClose={() => {
          modalQuestionDisclosure.onClose()
        }}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAlert
        open={modalAlertDisclosure.isOpen}
        onConfirm={async () => {
          await onDelete(id)
          modalConfirmDisclosure.onOpen()
        }}
        onClose={() => modalAlertDisclosure.onClose()}
        text={`Você está prestes a deletar a conta a pagar de número ${identifierCode}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={'Cancelar'}
      />
    </Fragment>
  )
}
