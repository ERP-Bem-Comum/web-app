import { TableRow } from '@mui/material'
import { GeneralReportData } from '@/types/reports/generalReport'
import { formatDate } from '@/utils/dates'
import TableCellStyled from '@/components/table/TableCellStyled'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'
import { pixKeyTypes } from '@/utils/enums'

interface GeneralReportRowParams {
  row: GeneralReportData
  visibleColumns: Array<keyof typeof DISPONIBLE_COLUMNS>
}

const formatBancaryData = (data: string | null) => {
  if (!data) return null
  const split = data.split(',')
  return (
    <section className="flex flex-col w-max max-w-[300px]">
      <span className="whitespace-nowrap text-ellipsis overflow-hidden">Banco:{split[0]}</span>
      <span className="whitespace-nowrap text-ellipsis overflow-hidden">Agencia:{split[1]}</span>
      <span className="whitespace-nowrap text-ellipsis overflow-hidden">
        Conta:{split[2]}-{split[3]}
      </span>
    </section>
  )
}

const formatPIX = (data: string | null) => {
  if (!data) return null
  const split = data.split(':')
  return (
    <span className="line-clamp-2 w-max max-w-[250px] break-words">
      {pixKeyTypes[split[0]]}:{split[1]}
    </span>
  )
}

export function GeneralReportRow({ row, visibleColumns }: GeneralReportRowParams) {
  const labelId = `generalreport-table-${row.ID}`
  const origin = window.location.origin

  const columnFormatters: {
    [key in keyof typeof DISPONIBLE_COLUMNS]?: (
      rowValue: string | null,
      index: number,
    ) => React.ReactNode
  } = {
    VENCIMENTO: (rowValue, index) => (
      <TableCellStyled key={index}>{rowValue ? formatDate(rowValue) : 'N/A'}</TableCellStyled>
    ),
    BANCARY: (rowValue, index) => (
      <TableCellStyled key={index}>{formatBancaryData(rowValue) ?? 'N/A'}</TableCellStyled>
    ),
    PIX: (rowValue, index) => (
      <TableCellStyled key={index}>{formatPIX(rowValue) ?? 'N/A'}</TableCellStyled>
    ),
    NUMERO_CONTRATO: (rowValue, index) => (
      <TableCellStyled key={index}>
        {rowValue ? (
          <a
            href={
              row.numero_contrato ? `${origin}/contratos/editar/${row.ID.replace('C', '')}` : ''
            }
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-1 underline text-erp-blue"
          >
            {rowValue ?? 'N/A'}
          </a>
        ) : (
          (rowValue ?? 'N/A')
        )}
      </TableCellStyled>
    ),
    CODE: (rowValue, index) => (
      <TableCellStyled key={index}>
        {rowValue ? (
          <a
            href={
              row.tipo === 'Pagamento'
                ? `${origin}/contas-pagar/editar/${row.E_ID}`
                : `${origin}/contas-receber/editar/${row.E_ID}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="decoration-1 underline text-erp-blue"
          >
            {rowValue ?? 'N/A'}
          </a>
        ) : (
          (rowValue ?? 'N/A')
        )}
      </TableCellStyled>
    ),
  }

  return (
    <TableRow
      key={labelId}
      tabIndex={-1}
      sx={{
        backgroundColor: 'white',
        '&:hover': { backgroundColor: '#F6FAFB' },
      }}
    >
      {Object.values(visibleColumns).map((value, index) => {
        const rowValue = row[value.toLocaleLowerCase() as keyof GeneralReportData]
        const formatter = columnFormatters[value]

        return formatter ? (
          formatter(rowValue, index)
        ) : (
          <TableCellStyled key={index} className="w-fit">
            <span className="line-clamp-2 w-max max-w-[250px] break-words">
              {rowValue ?? 'N/A'}
            </span>
          </TableCellStyled>
        )
      })}
    </TableRow>
  )
}
