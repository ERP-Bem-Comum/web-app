import { TableRow } from '@mui/material'
import { Fragment } from 'react'
import Image from 'next/image'
import BankImage from '../../../../public/images/BradescoImg.png'
import TableCellStyled from '@/components/table/TableCellStyled'
import { CreditCard } from '@/types/creditCard'

interface Params {
  row: CreditCard
  onClick: () => void
}

const CreditCardRow = ({ row, onClick }: Params) => {
  const labelId = `bank-table-checkbox-${row?.id}`
  return (
    <Fragment>
      <TableRow key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]" onClick={onClick}>
        <TableCellStyled border={false}>
          <div className="flex items-center">
            <div className="border-r border-[#D1D1D1] w-fit">
              <Image
                src={BankImage}
                alt="Bank"
                className="rounded-full w-8 h-8 mr-2"
                width={100}
                height={100}
              />
            </div>
            <span className="pl-2">{row.instituition}</span>
          </div>
        </TableCellStyled>
        <TableCellStyled border={true}>{row.name}</TableCellStyled>
        <TableCellStyled border={true}>{row.lastDigits}</TableCellStyled>
        <TableCellStyled border={true}>{row.responsible ?? 'N/A'}</TableCellStyled>
      </TableRow>
    </Fragment>
  )
}

export { CreditCardRow }
