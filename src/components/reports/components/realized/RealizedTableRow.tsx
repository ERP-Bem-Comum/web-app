import TableCellStyled from '@/components/table/TableCellStyled'
import { Button } from '@/components/ui/button'
import { TableRow } from '@mui/material'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore } from 'react-icons/md'
import RealizedTableTableRowSub from './RealizedTableRowSub'
import { CostCenterData } from '@/types/reports/realized'
import { calculateVariation } from '@/utils/calculate-variation'
import { validateMoneyValue } from '@/utils/budgetTotalCalculation'

interface Params {
  row: CostCenterData
}

export default function RealizedTableTableRow({ row }: Params) {
  const [openSub, setOpenSub] = useState(false)

  const labelId = `enhanced-table-checkbox-${row?.id}`

  // Calcular totais do centro de custo somando TODOS os meses de TODAS as categorias e subcategorias
  const calculateCostCenterTotals = () => {
    let totalProvisioned = 0
    let totalRealized = 0
    let totalExpected = 0

    row.categories?.forEach((category) => {
      // Verificar se a categoria tem subcategorias
      if (category.subCategories && category.subCategories.length > 0) {
        // Somar os valores mensais de todas as subcategorias
        category.subCategories.forEach((subCategory) => {
          subCategory.months?.forEach((month) => {
            totalProvisioned += validateMoneyValue(month.provisioned)
            totalRealized += validateMoneyValue(month.realized)
            totalExpected += validateMoneyValue(month.expected)
          })
        })
      } else {
        // Se não houver subcategorias, somar os valores mensais da própria categoria
        category.months?.forEach((month) => {
          totalProvisioned += validateMoneyValue(month.provisioned)
          totalRealized += validateMoneyValue(month.realized)
          totalExpected += validateMoneyValue(month.expected)
        })
      }
    })

    return {
      totalProvisioned,
      totalRealized,
      totalExpected,
    }
  }

  const costCenterTotals = calculateCostCenterTotals()

  const getTotalValueExpected = (cellId: number) => {
    let total = 0
    row.categories?.forEach((category) => {
      // Se a categoria tem subcategorias, somar valores das subcategorias
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          const find = subCategory?.months?.find((month: any) => month.month === cellId)
          total += validateMoneyValue(find?.expected)
        })
      } else {
        const find = category?.months?.find((month: any) => month.month === cellId)
        total += validateMoneyValue(find?.expected)
      }
    })
    return total / 100
  }

  const getTotalValueRealized = (cellId: number) => {
    let total = 0
    row.categories?.forEach((category) => {
      // Se a categoria tem subcategorias, somar valores das subcategorias
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          const find = subCategory?.months?.find((month: any) => month.month === cellId)
          total += validateMoneyValue(find?.realized)
        })
      } else {
        const find = category?.months?.find((month: any) => month.month === cellId)
        total += validateMoneyValue(find?.realized)
      }
    })
    return total / 100
  }

  const getTotalValueProvisioned = (cellId: number) => {
    let total = 0
    row.categories?.forEach((category) => {
      // Se a categoria tem subcategorias, somar valores das subcategorias
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          const find = subCategory?.months?.find((month: any) => month.month === cellId)
          total += validateMoneyValue(find?.provisioned)
        })
      } else {
        const find = category?.months?.find((month: any) => month.month === cellId)
        total += validateMoneyValue(find?.provisioned)
      }
    })
    return total / 100
  }

  const months = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  const getRows = () => {
    return months.map((month, index) => {
      return (
        <Fragment key={month}>
          <TableCellStyled border={true}>
            {getTotalValueProvisioned(Number(month)).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </TableCellStyled>
          <TableCellStyled border={true}>
            {getTotalValueRealized(Number(month)).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </TableCellStyled>
          <TableCellStyled border={true}>
            {getTotalValueExpected(Number(month)).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </TableCellStyled>
        </Fragment>
      )
    })
  }

  return (
    <Fragment>
      <TableRow key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]">
        <TableCellStyled>
          <div className="flex items-center">
            {row?.categories?.length > 0 && (
              <Button
                variant="ghost"
                data-test={`openSub-${row.id}`}
                size="icon"
                className="justify-start"
                onClick={(e) => {
                  setOpenSub(!openSub)
                  e.stopPropagation()
                }}
              >
                {openSub ? <MdOutlineExpandLess size={24} /> : <MdOutlineExpandMore size={24} />}
              </Button>
            )}{' '}
            <div>{row?.name}</div>
          </div>
        </TableCellStyled>
        <TableCellStyled>
          {(costCenterTotals.totalProvisioned / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>{' '}
        <TableCellStyled>
          {(costCenterTotals.totalRealized / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>{' '}
        <TableCellStyled>
          {(costCenterTotals.totalExpected / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableCellStyled>
        <TableCellStyled>
          {calculateVariation(costCenterTotals.totalRealized, costCenterTotals.totalExpected)}
        </TableCellStyled>
        {getRows()}
      </TableRow>
      {openSub &&
        row?.categories?.map((category) => (
          <RealizedTableTableRowSub key={category?.id} row={category} />
        ))}
    </Fragment>
  )
}
