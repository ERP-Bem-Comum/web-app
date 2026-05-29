import { Box, FormLabel, Modal } from '@mui/material'
import { MdBlock } from 'react-icons/md'

interface Props {
  open: boolean
  text: string
  handleOnClose: () => void
}

export function ModalNotFound({ open, text, handleOnClose }: Props) {
  return (
    <Modal
      open={open}
      className="flex items-center justify-center"
      slotProps={{
        backdrop: {
          onClick: (e) => {
            e.stopPropagation()
            handleOnClose()
          },
        },
      }}
    >
      <Box
        className={` bg-white border-[1px] border-solid border-erp-danger rounded-[10px] flex justify-center items-center p-5 gap-3`}
      >
        <MdBlock color={'#FF5353'} size={32} className="mb-1" />
        <div className="flex flex-col">
          <FormLabel className="font-bold text-black">Erro</FormLabel>
          <FormLabel className="text-black">{text}</FormLabel>
        </div>
      </Box>
    </Modal>
  )
}
