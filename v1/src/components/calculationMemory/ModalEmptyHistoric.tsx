import { Box, Modal } from '@mui/material'
import { MdOutlineClose, MdOutlineInfo } from 'react-icons/md'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
}

export function ModalEmptyHistoric({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white flex flex-col justify-center items-center w-[480px] pt-2 pb-6`}
      >
        <div className="w-full border-b border-b-[#E0E0E0] flex justify-between p-3">
          <div className="flex items-center">
            <MdOutlineInfo color={'#3B70BF'} size={26} />
            <div className="text-[#4d4d4d] ml-3">Aviso</div>
          </div>
          <div>
            <MdOutlineClose size={16} color={'#828282'} onClick={onClose} />
          </div>
        </div>
        <div className="p-3">
          <div className="font-bold mb-5">Sem histórico de gastos</div>
          <div>
            Se não houver o mesmo centro de custo habilitado do ano anterior para puxar o valor do
            executado ano anterior
          </div>
        </div>
      </Box>
    </Modal>
  )
}
