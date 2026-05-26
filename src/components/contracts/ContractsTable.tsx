'use client'

import { useGetAllFilteredContracts } from '@/services/contracts'
import { ContractRow, ParamsContracts } from '@/types/contracts'
import { filterContractsSchema } from '@/validators/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Paper, Table } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus } from 'lucide-react'
import { Paginator } from '../layout/paginator'
import { CustomTableBody } from '../table/CustomTableBody'
import { EnhancedTableHead } from '../table/CustomTableHead'
import { LoadingTable } from '../table/loadingTable'
import { Card, CardContent } from '../ui/card'
import { headCellsContracts } from './consts'
import { CustomContractRow } from './ContractRow'
import { HeaderContracts, StatusFilterKey } from './HeaderContracts'
import { deriveStatus, getMostRecentChild } from '@/utils/contracts/status'
import styles from './contractsGrid.module.css'

function filterByDerivedStatus(
  rows: ContractRow[] | undefined,
  statusFilter: StatusFilterKey
): ContractRow[] | undefined {
  if (!rows || statusFilter === 'todos') return rows

  if (statusFilter === 'vencendo') {
    const now = new Date()
    const threshold = 45 * 24 * 60 * 60 * 1000
    return rows.filter((row) => {
      const info = getMostRecentChild(row)
      if (!info?.contractPeriod?.end) return false
      const end = new Date(info.contractPeriod.end)
      const diff = end.getTime() - now.getTime()
      return diff > 0 && diff <= threshold
    })
  }

  return rows.filter((row) => {
    const info = getMostRecentChild(row)
    const derived = deriveStatus(info, !!row.children?.length)
    return derived.key === statusFilter
  })
}

export default function ContractsTable() {
  const [params, setParams] = useState({})
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('todos')

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParamsContracts>({
    resolver: zodResolver(filterContractsSchema),
  })

  const { paginationParams, payableParams, search } = watch()

  const { data: contractsResponse, isLoading } = useGetAllFilteredContracts({
    paginationParams,
    search,
    payableParams: params,
  })

  const router = useRouter()

  const handleFilter = (nextParams?: ParamsContracts['payableParams']) => {
    setParams({ ...(nextParams ?? payableParams) })
  }

  const filteredContracts = useMemo(
    () => filterByDerivedStatus(contractsResponse?.data, statusFilter),
    [contractsResponse?.data, statusFilter]
  )

  return (
    <div className={styles.shell}>
      <Card className={styles.panel}>
        <HeaderContracts
          control={control}
          errors={errors}
          handleFilter={handleFilter}
          values={watch()}
          setValue={setValue}
          contracts={contractsResponse?.data}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <CardContent className="p-0">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper
              sx={{
                width: '100%',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
                overflow: 'hidden',
              }}
            >
              {isLoading && <LoadingTable />}
              <div className={styles.tableWrap}>
                <Table
                  className={styles.table}
                  aria-labelledby="tableTitle"
                  size={'medium'}
                  stickyHeader
                >
                  <EnhancedTableHead headCells={headCellsContracts} />
                  <CustomTableBody items={filteredContracts}>
                    {(row, index) => (
                      <CustomContractRow
                        key={'contractRow' + index}
                        row={row}
                        index={index}
                        onClick={(id) => {
                          router.push(`/contratos/detalhes/${id}`)
                        }}
                      />
                    )}
                  </CustomTableBody>
                </Table>
              </div>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Bottombar conforme mockup */}
      <footer className={styles.bottombar}>
        <Paginator
          setValue={setValue}
          meta={contractsResponse ? contractsResponse.meta : null}
          filteredCount={filteredContracts?.length ?? 0}
        />
        <div className={styles.bottombarActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => router.push('/contratos/adicionar')}
          >
            <Plus size={14} />
            Novo Contrato
          </button>
        </div>
      </footer>
    </div>
  )
}
