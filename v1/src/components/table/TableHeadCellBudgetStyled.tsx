import { TableCell } from '@mui/material'

interface Props {
  children: any
  align: string
  backgroundColor?: string
  colSpan?: number
  borderLeft?: boolean
}

export default function TableHeadCellBudgetStyled({
  children,
  align = 'left',
  backgroundColor = '#BFEDFC',
  colSpan,
  borderLeft,
}: Props) {
  return (
    <TableCell
      sx={{
        backgroundColor,
        color: '#04222B',
        fontWeight: 600,
        height: 35,
        paddingY: 0,
        borderLeft: borderLeft ? '1px solid #a7a6a6' : undefined,
      }}
      align={align as 'inherit' | 'left' | 'center' | 'right' | 'justify'}
      colSpan={colSpan}
      className="whitespace-nowrap"
    >
      {children}
    </TableCell>
  )
}
