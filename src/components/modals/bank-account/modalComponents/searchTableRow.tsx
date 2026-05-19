import { TableRow } from '@mui/material'
import TableCellStyled from '../../../table/TableCellStyled'
import { formatDate } from '@/utils/dates'
import { maskCNPJ, maskCPF, maskMonetaryValue } from '@/utils/masks'
import { AppointmentRow } from '@/types/searchAppointments'

interface Params {
  row: AppointmentRow
  onClick: (row: AppointmentRow) => void
  isSelected: boolean
}

export default function SearchTableRow({ row, isSelected, onClick }: Params) {
  const labelId = `searchAppointment-${row?.id}`
  return (
    <TableRow
      key={labelId}
      tabIndex={-1}
      sx={{
        backgroundColor: isSelected ? '#d2d9db' : 'white',
        ':hover': {
          backgroundColor: isSelected ? '#d2d9db' : '#F6FAFB',
        },
      }}
      onClick={() => onClick(row)}
    >
      <TableCellStyled border={false} className="flex items-center">
        <span className="pl-2">{row.bank}</span>
      </TableCellStyled>
      <TableCellStyled border={true}>{row.identification}</TableCellStyled>
      <TableCellStyled border={true}>{row.aditionalDescription ?? 'N/A'}</TableCellStyled>
      <TableCellStyled border={true}>
        {row.cnpj?.length === 11 ? maskCPF(row.cnpj) : maskCNPJ(row.cnpj)}
      </TableCellStyled>
      <TableCellStyled border={true}>{formatDate(row.dueDate)}</TableCellStyled>
      <TableCellStyled border={true} align="right">
        {maskMonetaryValue(row.value)}
      </TableCellStyled>
    </TableRow>
  )
}
