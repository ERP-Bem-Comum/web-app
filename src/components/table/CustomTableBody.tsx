import { TableBody, TableRow } from '@mui/material'
import { ReactNode } from 'react'
import TableCellStyled from './TableCellStyled'

interface CustomTableRowProps<T> {
  children: (row: T, index: number) => ReactNode
  items?: Array<T> | null
}

export const CustomTableBody = <T,>({ children, items }: CustomTableRowProps<T>) => {
  if (!items || items.length === 0) {
    return (
      <TableBody id="tableBody">
        <TableRow className="p-4 text-erp-grayscale text-sm">
          <TableCellStyled className="w-fit whitespace-nowrap">
            Nenhum resultado encontrado
          </TableCellStyled>
        </TableRow>
      </TableBody>
    )
  }

  return <TableBody id="tableBody">{items.map((item, index) => children(item, index))}</TableBody>
}
