import TableCellStyled from '@/components/table/TableCellStyled'
import { Button } from '@/components/ui/button'
import { Category } from '@/types/reports/realized'
import { calculateVariation } from '@/utils/calculate-variation'
import { TableRow } from '@mui/material'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'
import { validateMoneyValue } from '@/utils/budgetTotalCalculation'

interface Params {
  row: Category
}

export default function RealizedTableTableRowSub({ row }: Params) {
  const [openSub, setOpenSub] = useState(false)

  // Calcular totais da categoria somando todas as subcategorias e seus meses
  const calculateCategoryTotals = () => {
    let totalProvisioned = 0
    let totalRealized = 0
    let totalExpected = 0

    // Se houver subcategorias, somar os valores delas
    if (row.subCategories && row.subCategories.length > 0) {
      row.subCategories.forEach((subCategory) => {
        // Somar os valores mensais de cada subcategoria
        subCategory.months?.forEach((month) => {
          totalProvisioned += validateMoneyValue(month.provisioned)
          totalRealized += validateMoneyValue(month.realized)
          totalExpected += validateMoneyValue(month.expected)
        })
      })
    } else {
      // Se não houver subcategorias, usar os valores dos meses da própria categoria
      row.months?.forEach((month) => {
        totalProvisioned += validateMoneyValue(month.provisioned)
        totalRealized += validateMoneyValue(month.realized)
        totalExpected += validateMoneyValue(month.expected)
      })
    }

    return {
      totalProvisioned,
      totalRealized,
      totalExpected,
    }
  }

  const categoryTotals = calculateCategoryTotals()

  // Calcular totais mensais da categoria somando subcategorias
  const getCategoryMonthTotal = (monthId: number, field: 'provisioned' | 'realized' | 'expected') => {
    let total = 0

    if (row.subCategories && row.subCategories.length > 0) {
      row.subCategories.forEach((subCategory) => {
        const monthData = subCategory.months?.find((m) => m.month === monthId)
        total += validateMoneyValue(monthData?.[field])
      })
    } else {
      const monthData = row.months?.find((m) => m.month === monthId)
      total += validateMoneyValue(monthData?.[field])
    }

    return total
  }

  const getMonthRows = () => {
    return row.months
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
        <TableCellStyled>
          <div className="ml-10 flex items-center">
            {row?.subCategories?.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="justify-start"
                onClick={(e) => {
                  setOpenSub(!openSub)
                  e.stopPropagation()
                }}
              >
                {openSub ? <MdOutlineExpandLess size={24} /> : <MdOutlineExpandMore size={24} />}
              </Button>
            )}
            <div>{row?.name}</div>
          </div>
        </TableCellStyled>
        <TableCellStyled>
          {(categoryTotals.totalProvisioned / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>{' '}
        <TableCellStyled>
          {(categoryTotals.totalRealized / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>{' '}
        <TableCellStyled>
          {(categoryTotals.totalExpected / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>
        <TableCellStyled>
          {calculateVariation(categoryTotals.totalRealized, categoryTotals.totalExpected)}
        </TableCellStyled>
        {getMonthRows()?.map((month) => (
          <Fragment key={month.month}>
            <TableCellStyled border={true}>
              {(getCategoryMonthTotal(month.month, 'provisioned') / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>
            <TableCellStyled border={true}>
              {(getCategoryMonthTotal(month.month, 'realized') / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>
            <TableCellStyled border={true}>
              {(getCategoryMonthTotal(month.month, 'expected') / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>
          </Fragment>
        ))}
      </TableRow>
      {openSub &&
        row?.subCategories?.map((subCategory) => (
          <TableRow
            key={subCategory.id}
            sx={{
              backgroundColor: '#F0F9FF',
              boxShadow: '0px 4px 10px 0px #D0F4FF inset',
              height: 87,
            }}
          >
            <TableCellStyled>
              <div className="ml-20">{subCategory?.name}</div>
            </TableCellStyled>
            <TableCellStyled>
              {(validateMoneyValue(subCategory.totalProvisioned) / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>{' '}
            <TableCellStyled>
              {(validateMoneyValue(subCategory.totalRealized) / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>{' '}
            <TableCellStyled>
              {(validateMoneyValue(subCategory.totalExpected) / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCellStyled>
            <TableCellStyled>
              {calculateVariation(validateMoneyValue(subCategory.totalRealized), validateMoneyValue(subCategory.totalExpected))}
            </TableCellStyled>
            {subCategory.months?.map((month) => (
              <Fragment key={month.month}>
                <TableCellStyled border={true}>
                  {(validateMoneyValue(month?.provisioned) / 100).toLocaleString('pt-br', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCellStyled>
                <TableCellStyled border={true}>
                  {(validateMoneyValue(month?.realized) / 100).toLocaleString('pt-br', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCellStyled>
                <TableCellStyled border={true}>
                  {(validateMoneyValue(month?.expected) / 100).toLocaleString('pt-br', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCellStyled>
              </Fragment>
            ))}
          </TableRow>
        ))}
    </Fragment>
  )
}
