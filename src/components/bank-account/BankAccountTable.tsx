'use client'

import { Box, InputAdornment, Paper, Table, TableContainer, TextField } from '@mui/material'
import { useState } from 'react'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { LoadingTable } from '../table/loadingTable'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import BankAccountTableRow from './BankAccountTableRow'
import { useGetBankAccounts } from '@/services/bankAccount'
import { useRouter } from 'next/navigation'
import { headCells } from './consts'
import { EnhancedTableHead } from '../table/CustomTableHead'
import { CustomTableBody } from '../table/CustomTableBody'

export default function BankAccountTable() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading: isLoadingBudget } = useGetBankAccounts()
  const router = useRouter()

  return (
    <div>
      <Card className="overflow-hidden">
        <CardHeader data-text="" className="p-4 flex items-center flex-row justify-between">
          <div className="flex items-center">
            <TextField
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label="Pesquise"
              size="small"
              sx={{ backgroundColor: '#fff', width: 392 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BiSearch size={20} color={'#155366'} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <div>
            <Button
              data-test="add"
              variant="erpPrimary"
              onClick={() => router.push('/contas-bancarias/adicionar')}
            >
              Adicionar Conta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Box sx={{ width: '100%' }}>
            <Paper
              sx={{
                width: '100%',
              }}
            >
              {isLoadingBudget ? (
                <LoadingTable />
              ) : (
                <TableContainer className="w-full overflow-auto">
                  <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                    <EnhancedTableHead headCells={headCells} />
                    <CustomTableBody items={data?.data}>
                      {(row, index) => (
                        <BankAccountTableRow
                          key={'bankAccount' + index}
                          row={row}
                          onClick={(id) => router.push(`/contas-bancarias/detalhes/${id}`)}
                        />
                      )}
                    </CustomTableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </div>
  )
}
