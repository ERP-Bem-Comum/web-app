'use client'

import { Box, Paper, Table, TableBody, TableContainer } from '@mui/material'
import RealizedTableTableRow from './RealizedTableRow'
import { RealizedExpectedData } from '@/types/reports/realized'
import RealizedTableHead from './RealizedTableHead'
import { validateMoneyValue } from '@/utils/budgetTotalCalculation'

interface Params {
  reportData?: RealizedExpectedData
  year?: Date
}

export default function RealizedTable({ reportData, year }: Params) {
  const calculateRealTotals = () => {
    let totalProvisioned = 0
    let totalRealized = 0
    let totalExpected = 0

    reportData?.costCenters?.forEach((costCenter) => {
      costCenter.categories?.forEach((category) => {
        if (category.subCategories && category.subCategories.length > 0) {
          category.subCategories.forEach((subCategory) => {
            subCategory.months?.forEach((month) => {
              totalProvisioned += validateMoneyValue(month.provisioned)
              totalRealized += validateMoneyValue(month.realized)
              totalExpected += validateMoneyValue(month.expected)
            })
          })
        } else {
          category.months?.forEach((month) => {
            totalProvisioned += validateMoneyValue(month.provisioned)
            totalRealized += validateMoneyValue(month.realized)
            totalExpected += validateMoneyValue(month.expected)
          })
        }
      })
    })

    return { totalProvisioned, totalRealized, totalExpected }
  }

  const realTotals = calculateRealTotals()

  return (
    <div>
      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{
            width: '100%',
          }}
        >
          <TableContainer className="w-full overflow-auto">
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
              <RealizedTableHead
                year={year}
                totalProvisioned={realTotals.totalProvisioned}
                totalExpected={realTotals.totalExpected}
                totalRealized={realTotals.totalRealized}
              />
              <TableBody id="tableBody" className="">
                {reportData?.costCenters.length ? (
                  reportData.costCenters.map((row) => {
                    return <RealizedTableTableRow key={row?.id} row={row} />
                  })
                ) : (
                  <div className="p-4 text-erp-grayscale text-sm">Nenhum resultado encontrado</div>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </div>
  )
}
