import { TableCell } from '@mui/material'
import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  border?: boolean
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit' | undefined
  padding?: string
  width?: string
  onClick?: () => void
  className?: string
}

export default function TableCellStyled({
  children,
  border = true,
  align = 'left',
  padding = '16px',
  width = 'auto',
  onClick,
  className,
}: Props) {
  return (
    <TableCell
      className={cn(`font-medium overflow-hidden text-ellipsis cursor-pointer`, className)}
      align={align}
      onClick={onClick}
      sx={{
        padding,
        width,
        border: border ? 'border-l border-[#D1D1D1]' : '',
      }}
    >
      {children}
    </TableCell>
  )
}
