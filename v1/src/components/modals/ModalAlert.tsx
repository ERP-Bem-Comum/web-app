import { Button } from '@/components/ui/button'
import { Box, Modal } from '@mui/material'
import { MdOutlineInfo } from 'react-icons/md'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  onConfirm: any
  text: string
  textConfirm?: string
  textCancel?: string
}

export function ModalAlert({
  open,
  onClose,
  onConfirm,
  text,
  textConfirm = 'Entendi',
  textCancel = 'Cancelar',
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-[1px] border-solid border-erp-danger rounded-[10px] flex flex-col justify-center items-center w-80 pt-2 px-9 pb-6`}
      >
        <MdOutlineInfo color={'#FF5353'} size={32} className="mb-4" />
        <div className="text-center mb-11">{text}</div>
        <Button
          data-test="modalCancelAlert"
          className="w-full mb-4"
          variant="erpPrimary"
          onClick={onClose}
        >
          {textCancel}
        </Button>
        <Button
          data-test="modalConfirmAlert"
          className="w-full"
          variant="erpSecondary"
          onClick={onConfirm}
        >
          {textConfirm}
        </Button>
      </Box>
    </Modal>
  )
}
