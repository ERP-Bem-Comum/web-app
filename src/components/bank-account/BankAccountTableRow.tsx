import { TableRow } from '@mui/material'
import TableCellStyled from '../table/TableCellStyled'
import { IBankAccountTable } from '@/types/bankAccount'
import { Fragment } from 'react'
import { formatDate } from '@/utils/dates'
import Image from 'next/image'
import { maskMonetaryValue } from '@/utils/masks'
import BankImage from '../../../public/images/BradescoImg.png'

type Data = IBankAccountTable

interface Params {
  row: Data
  onClick: (id: number) => void
}

export default function BankAccountTableRow({ row, onClick }: Params) {
  const labelId = `bank-table-checkbox-${row?.id}`
  return (
    <Fragment>
      <TableRow
        key={labelId}
        tabIndex={-1}
        className="hover:bg-[#F6FAFB]"
        onClick={() => onClick(row.id)}
      >
        <TableCellStyled border={false} className="flex items-center whitespace-nowrap">
          <div className="border-r border-[#D1D1D1] w-fit">
            <Image
              src={BankImage}
              alt="Bank"
              className="rounded-full w-8 h-8 mr-2"
              width={100}
              height={100}
            />
          </div>
          <span className="pl-2">{row.bank}</span>
        </TableCellStyled>
        <TableCellStyled border={true}>{row.name}</TableCellStyled>
        <TableCellStyled border={true}>{row.integration ?? 'N/A'}</TableCellStyled>
        <TableCellStyled border={true}>{formatDate(row.updatedAt)}</TableCellStyled>
        <TableCellStyled border={true}>{row.pendingReconciliations}</TableCellStyled>
        <TableCellStyled border={true} align="right">
          {maskMonetaryValue(row.systemBalance)}
        </TableCellStyled>
      </TableRow>
    </Fragment>
  )
}
