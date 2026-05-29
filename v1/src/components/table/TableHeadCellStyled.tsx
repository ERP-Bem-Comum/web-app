import { TableCell } from '@mui/material'

interface Props {
  children: any
  align?: any
  width?: string | number
}

export default function TableHeadCellStyled({ children, align = 'left', width }: Props) {
  return (
    <TableCell
      sx={{
        backgroundColor: '#F5F5F5',
        color: '#248DAD',
        fontWeight: 600,
        width,
        minWidth: width,
      }}
      align={align}
    >
      {children}
    </TableCell>
  )
}
