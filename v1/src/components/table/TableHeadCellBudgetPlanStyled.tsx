import { TableCell } from '@mui/material'

interface Props {
  children: any
  align?: any
}

export default function TableHeadCellBudgetPlanStyled({ children, align = 'left' }: Props) {
  return (
    <TableCell
      sx={{
        backgroundColor: '#BFEDFC',
        color: '#04222B',
        fontWeight: 600,
        maxHeight: 35,
      }}
      align={align}
    >
      {children}
    </TableCell>
  )
}
