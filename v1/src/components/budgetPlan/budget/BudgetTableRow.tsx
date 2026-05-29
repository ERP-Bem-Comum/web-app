import { IResult } from '@/services/budget'
import { getMonths } from '@/utils/dates'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
import { TableRow } from '@mui/material'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'
import { PiCalculatorLight } from 'react-icons/pi'
import TableCellStyled from '../../table/TableCellStyled'
import { Button } from '../../ui/button'
import BudgetTableRowSub from './ButgetTableRowSub'

interface Params {
  row: any
  budgetResults: IResult[]
  page: number
  changeSelectedCategory: any
  changeSelectedSubCategory: any
  changeModalShowCalculation: any
}

export default function BudgetTableRow({
  row,
  budgetResults,
  page,
  changeSelectedCategory,
  changeSelectedSubCategory,
  changeModalShowCalculation,
}: Params) {
  const [openSub, setOpenSub] = useState(false)
  const [showCalculation, setShowCalculation] = useState(false)
  const months = getMonths()

  const labelId = `enhanced-table-checkbox-${row?.id}`

  const getTotalValue = () => {
    if (budgetResults.length === 0) return 0

    const total = budgetResults?.reduce((total: number, value: IResult) => total + Number(value?.valueInCents || 0), 0)
    return total
  }

  const getMonthValue = (monthId: number) => {
    if (budgetResults.length === 0) return 0

    const monthValue = budgetResults?.reduce(
      (total: number, value: IResult) =>
        value?.month === monthId ? total + Number(value?.valueInCents || 0) : total,
      0,
    )
    return monthValue
  }

  const getResults = (subCategoryId: number) => {
    return budgetResults.filter((budget) => budget.costCenterSubCategoryId === subCategoryId)
  }

  const getMonthsSplit = () => {
    let monthsSplit
    page === 1 ? (monthsSplit = months.slice(0, 6)) : (monthsSplit = months.slice(6, 12))

    return monthsSplit
  }

  return (
    <Fragment>
      <TableRow key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]">
        <TableCellStyled border={false} padding={'0'}>
          <div
            className="w-full h-full flex items-center justify-between"
            onMouseEnter={() => setShowCalculation(true)}
            onMouseLeave={() => setShowCalculation(false)}
          >
            <div className="flex items-center p-4">
              {row?.subCategories?.length > 0 && (
                <Button
                  variant="ghost"
                  data-test={`openSub-${row.id}`}
                  size="icon"
                  onClick={(e) => {
                    setOpenSub(!openSub)
                    e.stopPropagation()
                  }}
                >
                  {openSub ? <MdOutlineExpandLess size={24} /> : <MdOutlineExpandMore size={24} />}
                </Button>
              )}{' '}
              <div>
                {row?.name}
                <div className="text-xs">
                  {formatCentsToCurrency(getTotalValue())}
                </div>
              </div>
            </div>
            <div
              onClick={() => {
                changeSelectedCategory(row)
                changeModalShowCalculation(true)
              }}
              className={`${
                showCalculation ? 'w-11' : 'w-0'
              } bg-erp-primary h-[72px] flex items-center justify-center transition-all ease-in-out duration-300 hover:cursor-pointer`}
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
      {openSub &&
        row?.subCategories?.map((subCategory: any) => (
          <BudgetTableRowSub
            key={subCategory?.id}
            row={subCategory}
            results={getResults(subCategory?.id)}
            page={page}
            category={row}
            changeSelectedCategory={changeSelectedCategory}
            changeSelectedSubCategory={changeSelectedSubCategory}
            changeModalShowCalculation={changeModalShowCalculation}
          />
        ))}
    </Fragment>
  )
}
