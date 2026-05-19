import * as React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { LastPayment } from '@/types/statistics'
import { maskMonetaryValue } from '@/utils/masks'

interface LastPaymentsTableProps {
  rows: LastPayment[]
}

export default function LastPaymentsTable({ rows }: LastPaymentsTableProps) {
  return (
    <TableContainer>
      <Table aria-label="table">
        <TableHead
          style={{
            backgroundColor: '#F5F6FB',
          }}
        >
          <TableRow>
            <TableCell>
              <span className="text-[#8898AA] text-sm">NOME</span>
            </TableCell>
            <TableCell align="center">
              <span className="text-[#8898AA] text-sm">VENCIMENTO</span>
            </TableCell>
            <TableCell align="center">
              <span className="text-[#8898AA] text-sm">CONTA</span>
            </TableCell>
            <TableCell align="center">
              <span className="text-[#8898AA] text-sm">VALOR</span>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody className="text-[#000748] text-sm">
          {rows.map((row) => (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ py: 1.75 }}>
                {row.name}
              </TableCell>
              <TableCell align="center" sx={{ py: 1.75 }}>
                {row.dueDate}
              </TableCell>
              <TableCell align="center" sx={{ py: 1.75 }}>
                {row.backAccount}
              </TableCell>
              <TableCell align="center" sx={{ py: 1.75 }}>
                {maskMonetaryValue(row.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
