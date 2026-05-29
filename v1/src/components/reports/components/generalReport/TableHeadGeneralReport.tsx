import { HeadCell } from '@/types/global'
import { TableHead, TableRow, TableCell } from '@mui/material'

interface TableHeadGeneralReportProps {
  headCells: Array<HeadCell>
}
const TableHeadGeneralReport = ({ headCells }: TableHeadGeneralReportProps) => {
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#BFEDFC' }}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={'left'}
            sx={{ fontWeight: 600, color: 'black' }}
            className={`whitespace-nowrap`}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export { TableHeadGeneralReport }
