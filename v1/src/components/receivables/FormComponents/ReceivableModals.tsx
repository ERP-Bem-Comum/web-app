import { ModalAlert } from '@/components/modals/ModalAlert'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import { useReceivableContext } from '@/hooks/useReceivableContext'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'

interface ReceivableModalsProps {
  identifierCode?: string
  hasReceivable: boolean
  id?: number
}

export const ReceivableModals = ({ identifierCode, hasReceivable, id }: ReceivableModalsProps) => {
  const router = useRouter()
  const {
    success,
    errorMessage,
    onDelete,
    disclosure: { modalAlertDisclosure, modalConfirmDisclosure, modalQuestionDisclosure },
  } = useReceivableContext()

  return (
    <Fragment>
      <ModalConfirm
        open={modalConfirmDisclosure.isOpen}
        onClose={() => {
          modalConfirmDisclosure.onClose()
          success && router.push('/contas-receber')
        }}
        text={
          success
            ? `Recebimento ${hasReceivable ? 'editado' : 'programado'}  com sucesso!`
            : errorMessage
        }
        success={success}
      />
      <ModalQuestion
        open={modalQuestionDisclosure.isOpen}
        onConfirm={() => {
          modalQuestionDisclosure.onClose()
          router.push('/contas-receber')
        }}
        onClose={modalQuestionDisclosure.onClose}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAlert
        open={modalAlertDisclosure.isOpen}
        onConfirm={() => {
          onDelete(id)
        }}
        onClose={modalAlertDisclosure.onClose}
        text={`Você está prestes a deletar o recebimento de número ${identifierCode}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={'Cancelar'}
      />
    </Fragment>
  )
}
