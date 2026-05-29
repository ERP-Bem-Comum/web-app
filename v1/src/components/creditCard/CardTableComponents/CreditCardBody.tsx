import { CustomTableBody } from '@/components/table/CustomTableBody'
import { EnhancedTableHead } from '@/components/table/CustomTableHead'
import { LoadingTable } from '@/components/table/loadingTable'
import { Table, TableContainer } from '@mui/material'
import { CreditCardRow } from './CreditCardRow'
import { useGetCreditCard } from '@/services/creditCard'
import { ParamsCreditCard } from '@/types/creditCard'
import { UseFormSetValue } from 'react-hook-form'
import { Paginator } from '@/components/layout/paginator'
import { headCellsCreditCard } from '../consts'
import { useRouter } from 'next/navigation'
import { CardContent } from '@/components/ui/card'

interface CreditCardBodyProps {
  params: ParamsCreditCard
  setValue: UseFormSetValue<ParamsCreditCard>
}
const CreditCardBody = ({ params, setValue }: CreditCardBodyProps) => {
  const router = useRouter()
  const { data, isLoading } = useGetCreditCard(params)

  return (
    <CardContent className="p-0">
      <Paginator meta={data?.meta ?? null} setValue={setValue}>
        {isLoading ? (
          <LoadingTable />
        ) : (
          <TableContainer className="w-full overflow-auto">
            <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
              <EnhancedTableHead headCells={headCellsCreditCard} />
              <CustomTableBody items={data?.data}>
                {(row, index) => (
                  <CreditCardRow
                    key={'cardRow' + index}
                    row={row}
                    onClick={() => router.push(`cartao/mov/${row.id}`)}
                  />
                )}
              </CustomTableBody>
            </Table>
          </TableContainer>
        )}
      </Paginator>
    </CardContent>
  )
}

export { CreditCardBody }
