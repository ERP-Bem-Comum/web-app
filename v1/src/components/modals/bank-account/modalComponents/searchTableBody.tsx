import { LoadingTable } from '@/components/table/loadingTable'
import { CardContent } from '../../../ui/card'
import { Box, Paper, Table, TableContainer } from '@mui/material'
import { EnhancedTableHead } from '@/components/table/CustomTableHead'
import { CustomTableBody } from '@/components/table/CustomTableBody'
import { headCells } from '../consts'
import SearchTableRow from './searchTableRow'
import { AppointmentRow, SearchAppointmentParams } from '@/types/searchAppointments'
import { UseFormSetValue } from 'react-hook-form'

interface SearchTableBodyParams {
  data: AppointmentRow[]
  isLoading: boolean
  rowCallBack: (row: AppointmentRow) => void
  maxHeight?: number | 'auto'
  setValue: UseFormSetValue<SearchAppointmentParams>
  values: SearchAppointmentParams
  currentSelectedId?: number
}

const SearchTableBody = ({
  data,
  isLoading,
  maxHeight = 'auto',
  values,
  currentSelectedId,
  rowCallBack,
  setValue,
}: SearchTableBodyParams) => {
  return (
    <CardContent className="p-0">
      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{
            width: '100%',
          }}
        >
          {isLoading ? (
            <LoadingTable />
          ) : (
            <TableContainer sx={{ width: '100%', maxHeight, overflowY: 'scroll' }}>
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
                size={'medium'}
                stickyHeader
              >
                <EnhancedTableHead headCells={headCells(setValue, values)} />
                <CustomTableBody items={data}>
                  {(row, index) => (
                    <SearchTableRow
                      key={'searchRow' + index}
                      row={row}
                      isSelected={row.id === currentSelectedId}
                      onClick={rowCallBack}
                    />
                  )}
                </CustomTableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </CardContent>
  )
}

export default SearchTableBody
