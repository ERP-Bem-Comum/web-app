import { Box } from '@mui/material'
import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface previewSectionProps {
  children: ReactNode
  className?: string
}

export const PreviewSection = ({ children, className }: previewSectionProps) => {
  return (
    <Box className={cn('flex flex-col justify-between w-full gap-[1px]', className)}>
      {children}
    </Box>
  )
}
