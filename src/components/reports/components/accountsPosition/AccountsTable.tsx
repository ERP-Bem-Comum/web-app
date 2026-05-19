import { LoadingTable } from '@/components/table/loadingTable'
import { HeadCell } from '@/types/global'
import { AccountsPosition } from '@/types/reports/accountsPosition'
import { List, TableContainer } from '@mui/material'
import { Fragment, useState } from 'react'
import AccountsTableRow from './AccountsTableRow'
import CollapseSection from '@/components/List/CollapseSection'
import ListHeader from '@/components/List/ListHeader'

interface AccountsTableProps {
  isLoading: boolean
  headCells: Array<HeadCell>
  data?: AccountsPosition
}

const AccountsTable = ({ isLoading, headCells, data }: AccountsTableProps) => {
  const [openFinancier, setOpenFinancier] = useState<number | string | null>(null)
  const [openCostCenter, setOpenCostCenter] = useState<number | string | null>(null)

  const handleToggleFinancier = (id: string | number) => {
    if (openFinancier === id) setOpenFinancier(null)
    else setOpenFinancier(id)
  }

  const handleToggleCostCenter = (id: string | number) => {
    if (openCostCenter === id) setOpenCostCenter(null)
    else setOpenCostCenter(id)
  }

  return (
    <TableContainer className="w-full overflow-auto">
      <ListHeader headCells={headCells} />
      {isLoading ? (
        <LoadingTable />
      ) : !data || data.itens.length === 0 ? (
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
          {data?.itens.map((row, index) => (
            <Fragment key={'account' + index}>
              <AccountsTableRow
                row={row}
                isOpen={openFinancier === row.id}
                onClick={handleToggleFinancier}
              />
              <CollapseSection
                data={row.costCenter}
                isOpen={openFinancier === row.id}
                renderItem={(cc, index) => (
                  <div key={'account' + index}>
                    <AccountsTableRow
                      row={cc}
                      onClick={handleToggleCostCenter}
                      isOpen={openCostCenter === cc.id}
                      isChild
                    />
                    <CollapseSection
                      data={cc.category}
                      isOpen={openCostCenter === cc.id}
                      renderItem={(ca, caIndex) => (
                        <AccountsTableRow
                          key={'account' + caIndex}
                          row={ca}
                          onClick={setOpenCostCenter}
                          isChild
                          isOpen={false}
                          toggleIcon={false}
                        />
                      )}
                    />
                  </div>
                )}
              />
            </Fragment>
          ))}
        </List>
      )}
    </TableContainer>
  )
}

export default AccountsTable
