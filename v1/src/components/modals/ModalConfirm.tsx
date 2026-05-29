import { Button } from '@/components/ui/button'
import { Box, Modal } from '@mui/material'
import { MdCheckCircleOutline, MdOutlineInfo } from 'react-icons/md'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  text: string
  textConfirm?: string
  success?: boolean
}

export function ModalConfirm({
  open,
  onClose,
  text,
  textConfirm = 'Entendi',
  success = true,
}: Props) {
  return (
    <Modal
      open={open}
      slotProps={{
        backdrop: {
          onClick: (e) => {
            e.stopPropagation()
            onClose()
          },
        },
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-[1px] border-solid ${
          success ? 'border-erp-primary' : 'border-erp-danger'
        } rounded-[10px] flex flex-col justify-center items-center w-80 pt-2 px-9 pb-6`}
      >
        {success ? (
          <MdCheckCircleOutline color={'#64BC47'} size={32} className="mb-4" />
        ) : (
          <MdOutlineInfo color={'#FF5353'} size={32} className="mb-4" />
        )}
        <text className="whitespace-break-spaces text-left mb-11 w-fit">{text}</text>
        <Button
          data-test="modalConfirm"
          className="w-full"
          variant="erpPrimary"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          {textConfirm}
        </Button>
      </Box>
    </Modal>
  )
}
