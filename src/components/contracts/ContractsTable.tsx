'use client'
import { useGetAllFilteredContracts } from '@/services/contracts'
import { ParamsContracts } from '@/types/contracts'
import { filterContractsSchema } from '@/validators/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Paper, Table, TableContainer } from '@mui/material'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Paginator } from '../layout/paginator'
import { CustomTableBody } from '../table/CustomTableBody'
import { EnhancedTableHead } from '../table/CustomTableHead'
import { LoadingTable } from '../table/loadingTable'
import { Card, CardContent } from '../ui/card'
import { headCellsContracts } from './consts'
import { CustomContractRow } from './ContractRow'
import { HeaderContracts } from './HeaderContracts'
export default function ContractsTable() {
  const [params, setParams] = useState({})

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParamsContracts>({
    resolver: zodResolver(filterContractsSchema),
  })

  const { paginationParams, payableParams, search } = watch()

  const { data: contracts, isLoading } = useGetAllFilteredContracts({
    paginationParams,
    search,
    payableParams: params,
    agreement: payableParams?.agreement,
  })
  const router = useRouter()

  const handleFilter = () => {
    setParams({ ...payableParams })
  }

  return (
    <Fragment>
      <Paginator setValue={setValue} meta={contracts ? contracts.meta : null}>
        <Card className="overflow-hidden">
          <HeaderContracts
            control={control}
            errors={errors}
            handleFilter={handleFilter}
            values={watch()}
          />
          <CardContent className="p-0">
            <Box sx={{ width: '100%' }}>
              <Paper
                sx={{
                  width: '100%',
                }}
              >
                {isLoading && <LoadingTable />}
                <TableContainer className="w-full overflow-auto">
                  <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                    <EnhancedTableHead headCells={headCellsContracts} />
                    <CustomTableBody items={contracts?.data}>
                      {(row, index) => (
                        <CustomContractRow
                          key={'contractRow' + index}
                          row={row}
                          index={index}
                          onClick={(id) => {
                            router.push(`contratos/editar/${id}`)
                          }}
                        />
                      )}
                    </CustomTableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Paginator>
    </Fragment>
  )
}
