import { Box, Modal } from '@mui/material'
import { ReactNode } from 'react'

interface ModalSearchAppointmentRootProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title: string
}

const ModalSearchAppointmentRoot = ({
  open,
  onClose,
  children,
  title,
}: ModalSearchAppointmentRootProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          width: '100wh',
          height: '100vh',
          paddingX: 8,
          backgroundColor: '#e8eef0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box className="py-[1%] w-full">
          <label className="font-bold text-xl">{title}</label>
        </Box>
        {children}
      </Box>
    </Modal>
  )
}

export default ModalSearchAppointmentRoot
