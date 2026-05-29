import { ContractStatus } from '@/enums/contracts'
import { ContractRow } from '@/types/contracts'
import {
  downloadPaymentHistoryDocument,
  downloadSettlementDocument,
} from '@/utils/contracts/documents'

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
  contractData,
}: {
  onOpenAnnexSettleModal: () => void
  onOpenConfirmModal: () => void
  onOpenPaymentHistoryModal: () => void
  onOpenAnnexWithDrawalModal: () => void
  onOpenAnnexSigned: () => void
  onOpenNotFoundModal: () => void
  handleCreateAditive: () => void
  onOpenDeleteModal?: () => void
  contractData?: ContractRow
}) => {
  return {
    getActionsForStatus: (status: ContractStatus) => {
      switch (status) {
        case ContractStatus.RASCUNHO:
          return [
            {
              name: 'Excluir',
              onClick: onOpenDeleteModal ?? (() => {}),
            },
          ]
        case ContractStatus.PENDING:
        case ContractStatus.ONGOING:
        case ContractStatus.SIGNED:
        case ContractStatus.FINISHED:
        case ContractStatus.DISTRATO:
          return [
            {
              name: 'Histórico de pagamentos',
              onClick: async () => {
                if (contractData) {
                  await downloadPaymentHistoryDocument(contractData)
                } else if (onOpenPaymentHistoryModal) {
                  onOpenPaymentHistoryModal()
                }
              },
            },
            {
              name: 'Termo de Quitação',
              onClick: () => {
                if (contractData) {
                  downloadSettlementDocument(contractData)
                } else if (onOpenAnnexSettleModal) {
                  onOpenAnnexSettleModal()
                }
              },
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
