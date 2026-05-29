import { BoxProps, Modal } from '@mui/material'
import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface ModalPreviewBaseProps {
  children: ReactNode
  title: string
  open: boolean
  handleOnClose: () => void
  width?: string
}

export const ModalPreviewBase = ({
  children,
  title,
  open,
  width = '420px',
  handleOnClose,
}: ModalPreviewBaseProps) => {
  return (
    <Modal open={open} onClose={handleOnClose}>
      <div className="w-full h-full flex justify-center overflow-auto p-10">
        <div
          className={cn('bg-gray-200 rounded-sm border-[1px] border-[#9C9C9C] p-3 h-fit')}
          style={{ width }}
        >
          <p className="font-bold text-black p-5">{title}</p>
          <div
            className={`bg-white text-black border-[1px] border-solid flex flex-col justify-center items-start p-5 gap-[20px] w-full rounded`}
          >
            {children}
          </div>
        </div>
      </div>
    </Modal>
  )
}
