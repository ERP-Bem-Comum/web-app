import { HeadCell } from '@/types/global'
import { TableHead, TableRow, TableCell } from '@mui/material'

interface TableHeaderProCustom {
  headCells: Array<HeadCell>
}
const TableHeadCustom = ({ headCells }: TableHeaderProCustom) => {
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#BFEDFC' }}>
        {headCells.map((headCell, index) => (
          <TableCell
            key={headCell.id}
            align={'left'}
            sx={{ fontWeight: 600, color: 'black' }}
            className={`whitespace-nowrap ${index === 0 ? 'bg-erp-primary' : ''}`}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default TableHeadCustom
