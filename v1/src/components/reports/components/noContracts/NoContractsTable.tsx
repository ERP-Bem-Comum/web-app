import { LoadingTable } from '@/components/table/loadingTable'
import { HeadCell } from '@/types/global'
import { List, TableContainer } from '@mui/material'
import { Fragment, useState } from 'react'
import NoContractsTableRow from './NoContractsTableRow'
import CollapseSection from '@/components/List/CollapseSection'
import ListHeader from '@/components/List/ListHeader'
import { NoContractsData } from '@/types/reports/noContracts'

interface NoContractsTableProps {
  isLoading: boolean
  headCells: Array<HeadCell>
  data?: Array<NoContractsData>
  currentLimit: number
}

const NoContractsTable = ({ isLoading, headCells, data, currentLimit }: NoContractsTableProps) => {
  const [openFinancier, setOpenFinancier] = useState<number | string | null>(null)

  const handleToggleFinancier = (id: string | number) => {
    if (openFinancier === id) setOpenFinancier(null)
    else setOpenFinancier(id)
  }

  return (
    <TableContainer className="w-full overflow-auto">
      <ListHeader headCells={headCells} sizes={[4.5, 2.5, 2.5, 2.5]} />
      {isLoading ? (
        <LoadingTable />
      ) : !data || data.length === 0 ? (
        <div className="p-4 text-erp-grayscale text-sm">Nenhum resultado encontrado</div>
      ) : (
        <List
          sx={{
            width: '100%',
            overflowY: 'auto',
            maxHeight: '450px',
            paddingRight: '5px',
          }}
          component="nav"
          aria-labelledby="nested-list-subheader"
        >
          {data.map((row, index) => (
            <Fragment key={'account' + index}>
              <NoContractsTableRow
                row={row}
                isOpen={openFinancier === row.id}
                onClick={handleToggleFinancier}
                limit={currentLimit}
              />
              <CollapseSection
                data={row.budgetPlan}
                isOpen={openFinancier === row.id}
                renderItem={(cc, index) => (
                  <NoContractsTableRow
                    row={cc}
                    isChild
                    toggleIcon={false}
                    limit={currentLimit}
                    key={'budgetPlan' + index}
                  />
                )}
              />
            </Fragment>
          ))}
        </List>
      )}
    </TableContainer>
  )
}

export default NoContractsTable
