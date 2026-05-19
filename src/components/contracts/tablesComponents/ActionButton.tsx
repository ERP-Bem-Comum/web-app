import { ModalAnnex } from '@/components/modals/contracts/ModalAnnex'
import { ModalPaymentHistory } from '@/components/modals/contracts/ModalPaymentHistory'
// import { ModalPaymentHistory } from '@/components/modals/contracts/ModalPaymentHistory'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import { ContractStatus } from '@/enums/contracts'
import { useContractContext } from '@/hooks/useContractsContext'
import { useDisclosure } from '@/hooks/useDisclosure'
import { settleContract, signContract, withdrawalContract } from '@/services/files'
import { contractActionsFactory } from '@/utils/UI/actionsFactory'
import { Menu, MenuItem } from '@mui/material'
import { HttpStatusCode } from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { BiDotsHorizontalRounded } from 'react-icons/bi'

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
}

export const ActionButton = ({
  status = ContractStatus.PENDING,
  contractId,
  aditiveId,
  fileLinks,
}: ActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const [openFunction, setOpenFunction] = useState<(() => void) | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: session } = useSession()

  const open = Boolean(anchorEl)

  const router = useRouter()
  
  const { onDelete, setIsDeleting, errorMessage: contextErrorMessage } = useContractContext()

  const {
    isOpen: isOpenAnnexSigned,
    onOpen: onOpenAnnexSigned,
    onClose: onCloseAnnexSigned,
  } = useDisclosure()

  const {
    isOpen: isOpenConfirmModal,
    onOpen: onOpenConfirmModal,
    onClose: onCloseConfirmModal,
  } = useDisclosure()
  
  const {
    isOpen: isOpenDeleteModal,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useDisclosure()

  const {
    isOpen: isOpenSuccessDeleteModal,
    onOpen: onOpenSuccessDeleteModal,
    onClose: onCloseSuccessDeleteModal,
  } = useDisclosure()

  const {
    isOpen: isOpenAnnexSettleModal,
    onOpen: onOpenAnnexSettleModal,
    onClose: onCloseAnnexSettleModal,
  } = useDisclosure()

  const {
    isOpen: isOpenSuccessSettleModal,
    onOpen: onOpenSuccessSettleModal,
    onClose: onCloseSuccessSettleModal,
  } = useDisclosure()

  const {
    isOpen: isOpenSuccessWithDrawalModal,
    onOpen: onOpenSuccessWithDrawalModa,
    onClose: onCloseSuccessWithDrawalModa,
  } = useDisclosure()

  const {
    isOpen: isOpenSuccessSignModal,
    onOpen: onOpenSuccessSignModa,
    onClose: onCloseSuccessSignModa,
  } = useDisclosure()

  const {
    isOpen: isOpenAnnexWithDrawalModal,
    onOpen: onOpenAnnexWithDrawalModal,
    onClose: onCloseAnnexWithDrawalModal,
  } = useDisclosure()

  const {
    isOpen: isOpenPaymentHistoryModal,
    onOpen: onOpenPaymentHistoryModal,
    onClose: onClosePaymentHistoryModal,
  } = useDisclosure()

  const {
    isOpen: isOpenNotFoundModal,
    onOpen: onOpenNotFoundModal,
    onClose: onCloseNotFoundModal,
  } = useDisclosure()

  const {
    isOpen: isOpenErrorModal,
    onOpen: onOpenErrorModal,
    onClose: onCloseErrorModal,
  } = useDisclosure()

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  const handleCreateAditive = () => {
    router.push(`/contratos/aditivo/${contractId}`)
  }
  
  const handleDeleteContract = async () => {
    setIsDeleting(true)
    await onDelete(aditiveId ?? contractId, status)
    onCloseDeleteModal()
    onOpenSuccessDeleteModal()
  }

  const actionsFactory = contractActionsFactory({
    onOpenAnnexSettleModal,
    onOpenPaymentHistoryModal,
    onOpenAnnexWithDrawalModal,
    onOpenConfirmModal,
    onOpenAnnexSigned,
    onOpenNotFoundModal,
    handleCreateAditive,
    onOpenDeleteModal,
  })

  const actionOptions = actionsFactory.getActionsForStatus(status)

  return (
    <Fragment>
      <div
        className="border border-[#E0E4E4] bg-[#EBF9FE] flex items-center justify-center text-sm rounded-sm py-1 px-2 w-fit aspect-square z-10"
        onClick={handleClickListItem}
      >
        <BiDotsHorizontalRounded size={20} />
      </div>
      <Menu
        id="lock-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'lock-button',
          role: 'listbox',
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
      <ModalQuestion
        onClose={onCloseDeleteModal}
        open={isOpenDeleteModal}
        onConfirm={handleDeleteContract}
        text="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
        textConfirm="Sim, excluir"
        textCancel="Cancelar"
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
      <ModalConfirm
        onClose={onCloseSuccessSignModa}
        open={isOpenSuccessSignModal}
        text="Contrato assinado anexado com sucesso!"
        textConfirm="Fechar"
      />
      <ModalConfirm
        onClose={() => {
          onCloseSuccessDeleteModal()
          setIsDeleting(false)
          if (!contextErrorMessage) {
            router.push('/contratos')
          }
        }}
        open={isOpenSuccessDeleteModal}
        text={contextErrorMessage || 'Contrato deletado com sucesso!'}
        success={!contextErrorMessage}
        textConfirm="Fechar"
      />
      <ModalAnnex
        onClose={onCloseAnnexSigned}
        onSubmit={async (file) => {
          const resp = await signContract(
            { contractId: aditiveId ?? contractId, userId: session?.user.id },
            file,
          )
          if (resp.status === HttpStatusCode.Created) {
            onCloseAnnexSigned()
            onOpenSuccessSignModa()
            setErrorMessage(null)
          } else {
            onOpenErrorModal()
            setErrorMessage(resp.data)
          }
        }}
        open={isOpenAnnexSigned}
        title="Anexar Contrato"
        text="Anexar contrato e marcar como assinado:"
        confirmButton="Anexar contrato"
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
      <ModalConfirm
        onClose={onCloseErrorModal}
        open={isOpenErrorModal}
        text={errorMessage ?? 'Erro ao anexar arquivo, tente novamente.'}
        success={false}
      />
    </Fragment>
  )
}
