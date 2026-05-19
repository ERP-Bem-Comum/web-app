import { ContractStatus } from '@/enums/contracts'
import { downloadFile } from '@/services/files'

type FileLink = {
  withdrawalUrl: string
  settleTermUrl: string
  signedContractUrl: string
}

export const contractActionsFactory = ({
  onOpenAnnexSettleModal,
  onOpenConfirmModal,
  onOpenPaymentHistoryModal,
  onOpenAnnexWithDrawalModal,
  onOpenAnnexSigned,
  onOpenNotFoundModal,
  handleCreateAditive,
  onOpenDeleteModal,
}: {
  onOpenAnnexSettleModal: () => void
  onOpenConfirmModal: () => void
  onOpenPaymentHistoryModal: () => void
  onOpenAnnexWithDrawalModal: () => void
  onOpenAnnexSigned: () => void
  onOpenNotFoundModal: () => void
  handleCreateAditive: () => void
  onOpenDeleteModal?: () => void
}) => {
  return {
    getActionsForStatus: (status: ContractStatus) => {
      switch (status) {
        case ContractStatus.PENDING:
          return [
            { name: 'Excluir', onClick: onOpenDeleteModal ?? onOpenConfirmModal },
            { name: 'Anexar contrato assinado', onClick: onOpenAnnexSigned },
          ]
        case ContractStatus.ONGOING:
          return [
            {
              name: 'Criar aditivo',
              onClick: handleCreateAditive,
            },
          ]
        case ContractStatus.SIGNED:
          return [
            {
              name: 'Histórico de pagamentos',
              onClick: onOpenPaymentHistoryModal,
            },
            {
              name: 'Baixar modelo Termo de Quitação',
              onClick: () => downloadFile('models/blank.pdf'),
            },
            {
              name: 'Baixar modelo Distrato',
              onClick: () => downloadFile('models/blank.pdf'),
            },
            { name: 'Quitar contrato', onClick: onOpenConfirmModal },
            { name: 'Distrato', onClick: onOpenConfirmModal },
            {
              name: 'Baixar Contrato assinado',
              onClick: ({ signedContractUrl }: FileLink) =>
                !signedContractUrl?.length
                  ? onOpenNotFoundModal()
                  : downloadFile(signedContractUrl),
            },
            {
              name: 'Criar aditivo',
              onClick: handleCreateAditive,
            },
          ]
        case ContractStatus.FINISHED:
          return [
            {
              name: 'Baixar Termo de Quitação',
              onClick: ({ settleTermUrl }: FileLink) =>
                !settleTermUrl?.length ? onOpenNotFoundModal() : downloadFile(settleTermUrl),
            },
            {
              name: 'Baixar Distrato',
              onClick: ({ withdrawalUrl }: FileLink) =>
                !withdrawalUrl?.length ? onOpenNotFoundModal() : downloadFile(withdrawalUrl),
            },
            {
              name: 'Histórico de pagamentos',
              onClick: onOpenPaymentHistoryModal,
            },
            {
              name: 'Baixar Contrato assinado',
              onClick: ({ signedContractUrl }: FileLink) =>
                !signedContractUrl?.length
                  ? onOpenNotFoundModal()
                  : downloadFile(signedContractUrl),
            },
            {
              name: 'Anexar Termo de Quitação assinado',
              onClick: onOpenAnnexSettleModal,
            },
          ]
        default:
          return []
      }
    },
    openModalForAction: (action: string) => {
      switch (action) {
        case 'Quitar contrato':
          return onOpenAnnexSettleModal
        case 'Distrato':
          return onOpenAnnexWithDrawalModal
        default:
          return null
      }
    },
  }
}
