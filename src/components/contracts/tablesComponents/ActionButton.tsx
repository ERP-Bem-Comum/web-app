import { ModalAnnex } from '@/components/modals/contracts/ModalAnnex'
import { ModalDeleteContract } from '@/components/modals/contracts/ModalDeleteContract'
import { ModalPaymentHistory } from '@/components/modals/contracts/ModalPaymentHistory'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import { ContractStatus } from '@/enums/contracts'
import { ContractRow } from '@/types/contracts'
import { useDisclosure } from '@/hooks/useDisclosure'
import { deleteContract } from '@/services/contracts'
import { settleContract, withdrawalContract } from '@/services/files'
import { contractActionsFactory } from '@/utils/UI/actionsFactory'
import { Menu, MenuItem } from '@mui/material'
import { HttpStatusCode } from 'axios'
import { useSession } from 'next-auth/react'
import { Fragment, useState } from 'react'
import { BiDotsHorizontalRounded } from 'react-icons/bi'
import styles from '../contractsGrid.module.css'

type FileLink = {
  withdrawalUrl: string
  settleTermUrl: string
  signedContractUrl: string
}

interface ActionButtonProps {
  status: ContractStatus
  contractId: number
  aditiveId: number | undefined
  fileLinks: FileLink
  contractData?: ContractRow
}

export const ActionButton = ({
  status = ContractStatus.PENDING,
  contractId,
  aditiveId,
  fileLinks,
  contractData,
}: ActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openFunction, setOpenFunction] = useState<(() => void) | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { data: session } = useSession()
  const open = Boolean(anchorEl)

  const { isOpen: isOpenConfirmModal, onOpen: onOpenConfirmModal, onClose: onCloseConfirmModal } = useDisclosure()
  const { isOpen: isOpenAnnexSettleModal, onOpen: onOpenAnnexSettleModal, onClose: onCloseAnnexSettleModal } = useDisclosure()
  const { isOpen: isOpenSuccessSettleModal, onOpen: onOpenSuccessSettleModal, onClose: onCloseSuccessSettleModal } = useDisclosure()
  const { isOpen: isOpenSuccessWithDrawalModal, onOpen: onOpenSuccessWithDrawalModa, onClose: onCloseSuccessWithDrawalModa } = useDisclosure()
  const { isOpen: isOpenAnnexWithDrawalModal, onOpen: onOpenAnnexWithDrawalModal, onClose: onCloseAnnexWithDrawalModal } = useDisclosure()
  const { isOpen: isOpenPaymentHistoryModal, onOpen: onOpenPaymentHistoryModal, onClose: onClosePaymentHistoryModal } = useDisclosure()
  const { isOpen: isOpenNotFoundModal, onOpen: onOpenNotFoundModal, onClose: onCloseNotFoundModal } = useDisclosure()
  const { isOpen: isOpenErrorModal, onOpen: onOpenErrorModal, onClose: onCloseErrorModal } = useDisclosure()
  const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure()

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  const actionsFactory = contractActionsFactory({
    onOpenAnnexSettleModal,
    onOpenPaymentHistoryModal,
    onOpenAnnexWithDrawalModal,
    onOpenConfirmModal,
    onOpenNotFoundModal,
    onOpenAnnexSigned: () => {},
    handleCreateAditive: () => {},
    onOpenDeleteModal,
    contractData,
  })

  const actionOptions = actionsFactory.getActionsForStatus(status)

  return (
    <Fragment>
      <div className={styles.rowAct} onClick={handleClickListItem}>
        <BiDotsHorizontalRounded size={16} />
      </div>
      <Menu
        id="lock-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'lock-button',
            role: 'listbox',
          },
        }}
        slotProps={{
          paper: {
            sx: {
              border: '0.5px solid #e5ded4',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
              padding: '4px',
              minWidth: '180px',
            },
          },
        }}
      >
        {actionOptions.map((op, index) => (
          <MenuItem
            key={index}
            disabled={false}
            onClick={(e) => {
              e.stopPropagation()
              op.onClick(fileLinks)
              setOpenFunction(() => actionsFactory.openModalForAction(op.name))
              handleClose(e)
            }}
            sx={{
              fontSize: '12px',
              color: '#332e29',
              borderRadius: '4px',
              padding: '7px 10px',
              '&:hover': {
                background: '#e8eef5',
              },
            }}
          >
            {op.name}
          </MenuItem>
        ))}
      </Menu>
      <ModalQuestion
        onClose={onCloseConfirmModal}
        open={isOpenConfirmModal}
        onConfirm={() => {
          if (openFunction) {
            openFunction()
            onCloseConfirmModal()
          }
        }}
        text="Ao continuar, o saldo restante lançado em contas a pagar será liquidado. Deseja prosseguir?"
        textConfirm="Sim"
      />
      <ModalConfirm
        onClose={onCloseSuccessSettleModal}
        open={isOpenSuccessSettleModal}
        text="Termo de quitação anexado com sucesso!"
        textConfirm="Fechar"
      />
      <ModalConfirm
        onClose={onCloseSuccessWithDrawalModa}
        open={isOpenSuccessWithDrawalModal}
        text="Distrato anexado com sucesso!"
        textConfirm="Fechar"
      />
      <ModalAnnex
        onClose={onCloseAnnexSettleModal}
        onSubmit={async (file) => {
          const resp = await settleContract(
            { contractId: aditiveId ?? contractId, userId: session?.user.id },
            file,
          )
          if (resp.status === HttpStatusCode.Created) {
            onCloseAnnexSettleModal()
            onOpenSuccessSettleModal()
          } else {
            onOpenErrorModal()
          }
        }}
        open={isOpenAnnexSettleModal}
        title="Anexar Termo de Quitação"
        text="Anexar termo de quitação e marcar como finalizado:"
        confirmButton="Anexar Termo"
      />
      <ModalAnnex
        onClose={onCloseAnnexWithDrawalModal}
        onSubmit={async (file) => {
          const resp = await withdrawalContract(
            { contractId: aditiveId ?? contractId, userId: session?.user.id },
            file,
          )
          if (resp.status === HttpStatusCode.Created) {
            onCloseAnnexWithDrawalModal()
            onOpenSuccessWithDrawalModa()
          } else {
            onOpenErrorModal()
          }
        }}
        open={isOpenAnnexWithDrawalModal}
        title="Anexar Distrato"
        text="Anexar Distrato e marcar como finalizado:"
        confirmButton="Anexar Distrato"
      />
      <ModalNotFound
        handleOnClose={onCloseNotFoundModal}
        open={isOpenNotFoundModal}
        text="Não há arquivo para baixar."
      />
      <ModalPaymentHistory
        contractId={contractId}
        onClose={onClosePaymentHistoryModal}
        open={isOpenPaymentHistoryModal}
      />
      <ModalDeleteContract
        open={isOpenDeleteModal}
        onClose={onCloseDeleteModal}
        onConfirm={async () => {
          await deleteContract(contractId)
          onCloseDeleteModal()
        }}
        contractCode={contractData?.contractCode}
      />
      <ModalConfirm
        onClose={onCloseErrorModal}
        open={isOpenErrorModal}
        text={errorMessage ?? 'Erro ao anexar arquivo, tente novamente.'}
        success={false}
      />
    </Fragment>
  )
}
