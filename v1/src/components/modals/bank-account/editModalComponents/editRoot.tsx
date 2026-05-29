import { Box, Modal } from '@mui/material'
import { ReactNode } from 'react'

interface EditRootProps {
  children: ReactNode
  open: boolean
  onClose: () => void
}
const EditRoot = ({ children, open, onClose }: EditRootProps) => {
  return (
    <Modal open={open} onClose={onClose} className="flex items-center justify-center">
      <Box className={`bg-white min-w-80 w-5/6 flex flex-col justify-center p-10 rounded`}>
        {children}
      </Box>
    </Modal>
  )
}

export { EditRoot }
