import { TableCell } from '@mui/material'

interface Props {
  children: any
  align?: any
}

export default function TableHeadCellStyled({ children, align = 'left' }: Props) {
  return (
    <TableCell
      sx={{
        backgroundColor: '#F5F5F5',
        color: '#248DAD',
        fontWeight: 600,
      }}
      align={align}
    >
      {children}
    </TableCell>
  )
}
