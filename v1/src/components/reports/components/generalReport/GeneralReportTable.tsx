import { LoadingTable } from '@/components/table/loadingTable'
import { HeadCell, Response } from '@/types/global'
import { TableContainer, Paper, Table } from '@mui/material'
import { GeneralReportData } from '@/types/reports/generalReport'
import { GeneralReportRow } from './GeneralReportRow'
import { UseFormSetValue } from 'react-hook-form'
import { Paginator } from '@/components/layout/paginator'
import { filterReportParams } from '@/types/reports/filters'
import { TableHeadGeneralReport } from './TableHeadGeneralReport'
import { CustomTableBody } from '@/components/table/CustomTableBody'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'

interface GeneralReportTableProps {
  isLoading: boolean
  headCells: Array<HeadCell>
  data: Array<GeneralReportData>
  meta?: Response<unknown>['meta']
  setValueForPagination: UseFormSetValue<filterReportParams>
  visibleColumns: Array<keyof typeof DISPONIBLE_COLUMNS>
}

const GeneralReportTable = ({
  isLoading,
  headCells,
  data,
  meta,
  visibleColumns,
  setValueForPagination,
}: GeneralReportTableProps) => {
  return (
    <div className="px-5 pb-5">
      {isLoading || !data ? (
        <LoadingTable />
      ) : (
        <Paginator meta={meta} setValue={setValueForPagination}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="general-report-table">
              <TableHeadGeneralReport headCells={headCells} />
              <CustomTableBody items={data}>
                {(row, index) => (
                  <GeneralReportRow
                    row={row}
                    key={row.ID + index}
                    visibleColumns={visibleColumns}
                  />
                )}
              </CustomTableBody>
            </Table>
          </TableContainer>
        </Paginator>
      )}
    </div>
  )
}

export default GeneralReportTable
