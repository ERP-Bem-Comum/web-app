import { Box } from '@mui/material'
import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface ContentSectionProps {
  children: ReactNode
  className?: string
}
const ContentSection = ({ children, className }: ContentSectionProps) => {
  return (
    <Box className={cn('px-2 py-10 rounded-lg bg-card text-card-foreground', className)}>
      {children}
    </Box>
  )
}

export { ContentSection }
