import { Box, Modal } from '@mui/material'
import { AiOutlineEllipsis } from 'react-icons/ai'

interface Props {
  open: boolean
  text: string
}

export function ModalAwait({ open, text }: Props) {
  return (
    <Modal
      open={open}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-[1px] border-solid border-erp-primary rounded-[10px] flex flex-col justify-center items-center w-80 pt-2 px-9 pb-6`}
      >
        <AiOutlineEllipsis size={32} className="mb-4 animate-ping text-erp-primary " />

        <div className="text-center mb-11">{text}</div>
      </Box>
    </Modal>
  )
}
