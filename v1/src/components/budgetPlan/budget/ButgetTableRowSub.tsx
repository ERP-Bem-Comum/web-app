import { IResult } from '@/services/budget'
import { ICostCenterCategory } from '@/types/category'
import { getMonths } from '@/utils/dates'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
import { TableRow } from '@mui/material'
import { Fragment, useState } from 'react'
import { PiCalculatorLight } from 'react-icons/pi'
import TableCellStyled from '../../table/TableCellStyled'

interface Data {
  id: number
  name: string
  budgets: any[]
  valueInCents: number
}

interface Params {
  row: Data
  results: IResult[]
  page: number
  category: ICostCenterCategory
  changeSelectedCategory: any
  changeSelectedSubCategory: any
  changeModalShowCalculation: any
}

export default function BudgetTableRowSub({
  row,
  results,
  page,
  category,
  changeSelectedCategory,
  changeSelectedSubCategory,
  changeModalShowCalculation,
}: Params) {
  const months = getMonths()
  const [showCalculation, setShowCalculation] = useState(false)
  const [modalShowCalculation, setModalShowCalculation] = useState(false)
  const getTotalValue = () => {
    if (results.length === 0) return 0

    return results?.reduce((total: number, value: IResult) => total + Number(value?.valueInCents || 0), 0)
  }

  const getMonthValue = (monthId: number) => {
    if (results.length === 0) return 0

    return results?.reduce(
      (total: number, value: IResult) =>
        value?.month === monthId ? total + Number(value?.valueInCents || 0) : total,
      0,
    )
  }

  const getMonthsSplit = () => {
    let monthsSplit
    page === 1 ? (monthsSplit = months.slice(0, 6)) : (monthsSplit = months.slice(6, 12))

    return monthsSplit
  }

  return (
    <Fragment>
      <TableRow
        sx={{
          backgroundColor: '#EBF9FE',
          boxShadow: '0px 4px 10px 0px #D0F4FF inset',
          height: 87,
        }}
      >
        <TableCellStyled border={false} padding={'0'}>
          <div
            className="w-full h-full flex items-center justify-between"
            onMouseEnter={() => setShowCalculation(true)}
            onMouseLeave={() => setShowCalculation(false)}
          >
            <div className="ml-10  p-4">
              {row?.name}
              <div className="text-xs">
                {formatCentsToCurrency(getTotalValue())}
              </div>
            </div>
            <div
              onClick={() => {
                changeSelectedCategory(category)
                changeSelectedSubCategory(row)
                changeModalShowCalculation(true)
              }}
              className={`${
                showCalculation ? 'w-11' : 'w-0'
              } bg-erp-primary h-[87px] flex items-center justify-center transition-all ease-in-out duration-300 hover:cursor-pointer`}
            >
              <PiCalculatorLight size={24} />
            </div>
          </div>
        </TableCellStyled>
        {getMonthsSplit().map((month) => (
          <TableCellStyled key={month?.id} border={true}>
            {formatCentsToCurrency(getMonthValue(month?.id))}
          </TableCellStyled>
        ))}
      </TableRow>
    </Fragment>
  )
}
