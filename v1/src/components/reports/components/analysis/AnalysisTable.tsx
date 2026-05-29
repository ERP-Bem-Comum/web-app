import { LoadingTable } from '@/components/table/loadingTable'
import { HeadCell } from '@/types/global'
import { TableContainer, Paper, Table, TableBody } from '@mui/material'
import { Fragment, useState } from 'react'
import AnalysisTableRow from './AnalysisTableRow'
import { AnalysisReportData } from '@/types/reports/analysis'
import TableRowCollapse from './TableRowCollapse'
import TableHeadCustom from './TableHeadCustom'
import { getMonthName } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'

interface AnalysisTableProps {
  isLoading: boolean
  headCells: Array<HeadCell>
  data: AnalysisReportData
}

const AnalysisTable = ({ isLoading, headCells, data: analysisData }: AnalysisTableProps) => {
  const [openFinancier, setOpenFinancier] = useState<number | string | null>(null)

  const { data, totalValueOfPeriod } = analysisData

  const handleToggleFinancier = (id: string | number) => {
    if (openFinancier === id) setOpenFinancier(null)
    else setOpenFinancier(id)
  }

  const monthsHeadCells: HeadCell[] =
    data[0]?.itens?.map((item) => {
      const [month, year] = item.monthYear.split('/')

      const monthName = getMonthName(parseInt(month, 10))

      return {
        id: item.monthYear,
        label: `${monthName}/${year}`,
        align: 'left',
      }
    }) || []

  return (
    <Fragment>
      {isLoading || !data ? (
        <LoadingTable />
      ) : (
        <div>
          <div className="w-full bg-[#BFEDFC] px-4 py-1">
            <h2 className="font-semibold text-sm">
              VALOR TOTAL DO PERÍODO: {maskMonetaryValue(totalValueOfPeriod)}
            </h2>
          </div>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="analysis table">
              <TableHeadCustom headCells={[...headCells, ...monthsHeadCells]} />
              <TableBody>
                {data.map((row, index) => (
                  <Fragment key={'account' + index}>
                    <AnalysisTableRow
                      row={row}
                      isOpen={openFinancier === row.id}
                      onClick={handleToggleFinancier}
                    />
                    <TableRowCollapse
                      data={row.CostCenter}
                      isOpen={openFinancier === row.id}
                      renderItem={(cc, index) => {
                        return (
                          <AnalysisTableRow
                            key={'CostCenter' + index}
                            row={cc}
                            isChild
                            toggleIcon={false}
                          />
                        )
                      }}
                    />
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </Fragment>
  )
}

export default AnalysisTable
