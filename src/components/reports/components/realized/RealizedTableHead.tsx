import TableHeadCellBudgetStyled from '@/components/table/TableHeadCellBudgetStyled'
import { HeadCell } from '@/types/global'
import { getMonths } from '@/utils/dates'
import { TableCell, TableHead, TableRow } from '@mui/material'
import { validateMoneyValue } from '@/utils/budgetTotalCalculation'

interface EnhancedTableProps {
  totalRealized?: number
  totalExpected?: number
  totalProvisioned?: number
  year?: Date
}

function RealizedTableHead({
  totalProvisioned = 0,
  totalRealized = 0,
  totalExpected = 0,
  year,
}: EnhancedTableProps) {
  const validProvisioned = validateMoneyValue(totalProvisioned)
  const validRealized = validateMoneyValue(totalRealized)
  const validExpected = validateMoneyValue(totalExpected)

  return (
    <TableHead>
      <TableRow>
        <TableHeadCellBudgetStyled colSpan={5} align="left">
          VALOR TOTAL PROVISIONADO:{' '}
          {(validProvisioned / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}{' '}
          / VALOR TOTAL REALIZADO:{' '}
          {(validRealized / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}{' '}
          / VALOR TOTAL PLANEJADO:{' '}
          {(validExpected / 100).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL',
          })}
        </TableHeadCellBudgetStyled>
        {getMonths()
          .reverse()
          .map((headCell) => (
            <TableHeadCellBudgetStyled
              key={headCell.id}
              align={'center'}
              backgroundColor={'#BFEDFC'}
              colSpan={3}
              borderLeft
            >
              <div className="flex justify-center font-semibold text-sm whitespace-nowrap">
                {headCell.name.slice(0, 3).toUpperCase()}/
                {year?.toLocaleDateString('pt-BR', {
                  year: '2-digit',
                })}
              </div>
            </TableHeadCellBudgetStyled>
          ))}
      </TableRow>
      <TableRow>
        <TableHeadCellBudgetStyled backgroundColor={'#76D9F8'} align="left">
          CENTRO DE CUSTO
        </TableHeadCellBudgetStyled>
        <TableHeadCellBudgetStyled backgroundColor={'#76D9F8'} align="left">
          PROVISIONADO
        </TableHeadCellBudgetStyled>
        <TableHeadCellBudgetStyled backgroundColor={'#76D9F8'} align="left">
          REALIZADO
        </TableHeadCellBudgetStyled>
        <TableHeadCellBudgetStyled backgroundColor={'#76D9F8'} align="left">
          PLANEJADO
        </TableHeadCellBudgetStyled>
        <TableHeadCellBudgetStyled backgroundColor={'#76D9F8'} align="left">
          AV (%) DO PLANEJADO
        </TableHeadCellBudgetStyled>

        {getMonths().map((headCell) => (
          <>
            <TableHeadCellBudgetStyled
              backgroundColor={'#76D9F8'}
              align="left"
              key={headCell.id + 12}
            >
              PROVISIONADO
            </TableHeadCellBudgetStyled>
            <TableHeadCellBudgetStyled
              backgroundColor={'#76D9F8'}
              align="left"
              key={headCell.id + 12}
            >
              REALIZADO
            </TableHeadCellBudgetStyled>
            <TableHeadCellBudgetStyled
              backgroundColor={'#76D9F8'}
              align="left"
              key={headCell.id + 13}
            >
              PLANEJADO
            </TableHeadCellBudgetStyled>
          </>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default RealizedTableHead
