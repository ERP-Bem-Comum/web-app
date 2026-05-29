import { Grid } from '@mui/material'
import { cn } from 'lib/utils'
import { ReactNode } from 'react'

interface GridCellProps {
  children: ReactNode
  border?: boolean
  className?: string
  size?: number
}
const GridCell = ({ children, border, className, size = 12 / 4 }: GridCellProps) => {
  return (
    <Grid
      xs={size}
      item
      className={cn(
        `flex font-medium ${
          border ? 'border-l border-[#D1D1D1]' : ''
        } overflow-hidden text-ellipsis cursor-pointer p-2 items-center`,
        className,
      )}
    >
      {children}
    </Grid>
  )
}

export default GridCell
