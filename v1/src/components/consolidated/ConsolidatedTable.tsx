'use client'
import { LoadingTable } from '@/components/table/loadingTable'
import TableHeadCellBudgetStyled from '@/components/table/TableHeadCellBudgetStyled'
import { Button } from '@/components/ui/button'
import { exportBudgetPlanConsolidatedCSV, useGetConsolidated } from '@/services/budgetPlan'
import { useGetConsolidatedShared } from '@/services/budgetPlanShared'
import { IProgram, getPrograms } from '@/services/programs'
import { getMonths, getYears } from '@/utils/dates'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
import { BudgetPlanStatus } from '@/enums/budgetPlan'
import { calculateBudgetTotal, calculateMonthTotal } from '@/utils/budgetTotalCalculation'
import {
  Autocomplete,
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IoShareSocialOutline } from 'react-icons/io5'
import { MdOutlineArrowLeft, MdOutlineArrowRight, MdOutlineDownload } from 'react-icons/md'
import { ModalConfirm } from '../modals/ModalConfirm'
import ConsolidatedTableRow from './ConsolidatedTableRow'
import { ModalExportConsolidatedShared } from './ModalExportConsolidatedShared'
import { ModalShareConsolidated } from './ModalShareConsolidated'

interface Params {
  shared?: boolean
}

interface HeadCell {
  id: string
  label: string
  align: any
  value: number
}

interface EnhancedTableProps {
  headCells: HeadCell[]
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { headCells } = props

  return (
    <TableHead>
      <TableRow>
        {headCells?.map((headCell) => (
          <TableHeadCellBudgetStyled
            key={headCell.id}
            align={headCell.align}
            backgroundColor={headCell?.id === 'category' ? '#76D9F8' : '#BFEDFC'}
          >
            <div className="font-semibold text-sm">{headCell.label}</div>
          </TableHeadCellBudgetStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}

function EnhancedTableFooter(props: EnhancedTableProps) {
  const { headCells } = props

  return (
    <TableFooter
      sx={{
        position: 'sticky',
        bottom: 0,
      }}
    >
      <TableRow>
        {headCells?.map((headCell) => (
          <TableHeadCellBudgetStyled
            key={headCell.id}
            align={headCell.align}
            backgroundColor={headCell?.id === 'category' ? '#76D9F8' : '#BFEDFC'}
          >
            <div className="font-semibold text-sm">
              {headCell?.id === 'category' && 'TOTAL: '}
              {headCell.value
                ? (headCell.value / 100).toLocaleString('pt-br', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : 'R$ 0,00'}
            </div>
          </TableHeadCellBudgetStyled>
        ))}
      </TableRow>
    </TableFooter>
  )
}

export default function ConsolidatedTable({ shared = false }: Params) {
  const date = new Date()
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [headCells, setHeadCells] = useState<HeadCell[]>([])
  const [rows, setRows] = useState<any>([])
  const [selectedYear, setSelectedYear] = useState<number>(date.getFullYear())
  const [filterYear, setFilterYear] = useState<number>(date.getFullYear())
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null)
  const [filterProgram, setFilterProgram] = useState<IProgram | null>(null)
  const [modalOpenShareConsolidated, setModalOpenShareConsolidated] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [modalOpenConfirmExport, setModalOpenConfirmExport] = useState(false)
  const [modalOpenExportShared, setModalOpenExportShared] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [totalValue, setTotalValue] = useState(0)
  const [totalAllPrograms, setTotalAllPrograms] = useState(0)
  const [listPrograms, setListPrograms] = useState<IProgram[]>([])

  const { data: dataConsolidated, isLoading: isLoadingConsolidated } = useGetConsolidated(
    {
      year: filterYear,
      programId: filterProgram?.id || null,
      status: BudgetPlanStatus.APROVADO,
    },
    !shared,
  )

  const { data: dataConsolidatedAll, isLoading: isLoadingConsolidatedAll } = useGetConsolidated(
    {
      year: filterYear,
      programId: null,
      status: BudgetPlanStatus.APROVADO,
    },
    !shared,
  )

  const { data: dataConsolidatedShared, isLoading: isLoadingConsolidatedShared } =
    useGetConsolidatedShared(shared)

  const loadPrograms = async () => {
    const resp = await getPrograms({
      page: 1,
      limit: 99999999,
      search: '',
      active: null,
    })

    setListPrograms(resp?.items)
  }

  useEffect(() => {
    if (!shared) {
      loadPrograms()
    }
  }, [])

  useEffect(() => {
    if (dataConsolidatedAll?.data && !shared) {
      const totalAll = calculateBudgetTotal(dataConsolidatedAll.data)
      setTotalAllPrograms(totalAll)
    }
  }, [dataConsolidatedAll?.data, shared])

  const getTotalMonth = (month: number) => {
    const data = shared ? dataConsolidatedShared : dataConsolidated
    return calculateMonthTotal(data?.data, month)
  }

  useEffect(() => {
    const currentData = shared ? dataConsolidatedShared?.data : dataConsolidated?.data
    
    if (!currentData) return

    // SEMPRE usar o total calculado do frontend para garantir precisão
    const finalTotal = calculateBudgetTotal(currentData)

    const headCellsTemp = [
      {
        id: 'category',
        align: 'left',
        label: 'TOTAL: ' + (finalTotal / 100).toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }),
        value: finalTotal,
      },
    ]

    setQntPage(2)

    let monthList = []

    if (page === 1) {
      monthList = getMonths().slice(0, 6)
    } else {
      monthList = getMonths().slice(6, 12)
    }

    monthList.forEach((month) => {
      headCellsTemp?.push({
        id: month?.id.toString(),
        align: 'left',
        label: month?.name?.toUpperCase(),
        value: getTotalMonth(month?.id),
      })
    })

    setTotalValue(finalTotal)

    setHeadCells(headCellsTemp)
    setRows(currentData.costCenters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataConsolidated?.data, page, dataConsolidatedShared?.data])

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [qntPage, page])

  const handleChangePage = (direction: string) => {
    if (direction === 'prev') {
      setPage(page - 1)
    } else {
      setPage(page + 1)
    }
  }

  const handleFilter = () => {
    setPage(1)
    setFilterYear(selectedYear)
    setFilterProgram(selectedProgram)
  }

  const handleExport = async () => {
    setIsDisabled(true)
    
    try {
      // Gerar dados para Excel
      const currentData = shared ? dataConsolidatedShared?.data : dataConsolidated?.data
      
      if (!currentData) {
        setSuccess(false)
        setErrorMessage('Nenhum dado disponível para exportação')
        setModalOpenConfirmExport(true)
        return
      }

      // Criar dados para Excel
      const excelData = []
      
      // Cabeçalho
      const header = ['Centro de Custo', 'Categoria', 'Subcategoria']
      const months = getMonths()
      months.forEach(month => {
        header.push(month.name)
      })
      header.push('Total')
      excelData.push(header)

      // Dados dos centros de custo
      currentData.costCenters?.forEach((costCenter: any) => {
        // Linha do centro de custo
        const costCenterRow = [costCenter.name, '', '', ...months.map(() => ''), formatCentsToCurrency(costCenter.valueInCents || 0)]
        excelData.push(costCenterRow)

        // Linhas das categorias
        costCenter.categories?.forEach((category: any) => {
          const categoryRow = ['', category.name, '', ...months.map(month => {
            const monthData = category.months?.find((m: any) => m.month === month.id)
            return formatCentsToCurrency(monthData?.valueInCents || 0)
          }), formatCentsToCurrency(category.valueInCents || 0)]
          excelData.push(categoryRow)
        })
      })

      // Linha de totais
      const totalRow = ['TOTAL', '', '', ...months.map(month => {
        const monthTotal = getTotalMonth(month.id)
        return formatCentsToCurrency(monthTotal)
      }), formatCentsToCurrency(totalValue)]
      excelData.push(totalRow)

      // Converter para CSV (formato que pode ser aberto no Excel)
      const csvContent = excelData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n')

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `consolidado_${filterYear}_${filterProgram?.name || 'todos_programas'}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(true)
      setModalOpenConfirmExport(true)
    } catch (err) {
      setSuccess(false)
      setErrorMessage('Erro ao exportar dados')
      setModalOpenConfirmExport(true)
    } finally {
      setIsDisabled(false)
    }
  }

  return (
    <div className="bg-white">
      <div className="flex justify-between items-center p-4">
        <div className="text-3xl me-2">{filterYear} ABC</div>
        <div className="text-[#155366]">
          <div className="text-xl">
            Total:{' '}
            {((filterProgram ? totalAllPrograms : totalValue) / 100).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          {filterProgram && (
            <div className="text-sm">
              Programa {filterProgram?.name}:{' '}
              {(totalValue / 100).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          )}
        </div>
      </div>
      <div className="bg-erp-baseLight py-5 px-4 flex justify-between items-center">
        {shared ? (
          <div />
        ) : (
          <div className="flex">
            <Autocomplete
              id="year"
              size="small"
              noOptionsText="Ano Base"
              disableClearable
              value={selectedYear}
              options={getYears()}
              onChange={(_event, newValue) => {
                setSelectedYear(newValue)
              }}
              renderInput={(params) => <TextField {...params} label="Ano Base" />}
              sx={{
                width: 142,
                backgroundColor: '#fff',
                marginRight: '16px',
              }}
            />
            <Autocomplete
              id="city"
              size="small"
              noOptionsText="Programas"
              value={selectedProgram}
              options={listPrograms}
              getOptionLabel={(option) => option?.name}
              onChange={(_event, newValue) => {
                setSelectedProgram(newValue)
              }}
              loading={listPrograms.length === 0}
              renderInput={(params) => <TextField {...params} label="Programas" />}
              sx={{
                width: 142,
                backgroundColor: '#fff',
                marginRight: '16px',
              }}
            />
            <Button data-test="filter" variant="erpSecondary" onClick={() => handleFilter()}>
              Filtrar
            </Button>
          </div>
        )}
        <div className="flex items-center">
          <Button
            data-test="export"
            variant="erpSecondary"
            className="mr-2"
            onClick={() => {
              shared ? setModalOpenExportShared(true) : handleExport()
            }}
            disabled={isDisabled}
          >
            {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Exportar Excel <MdOutlineDownload size={18} className="ml-2" />
          </Button>
          {!shared && (
            <Button
              data-test="share"
              variant="erpSecondary"
              size="icon"
              onClick={() => setModalOpenShareConsolidated(true)}
            >
              <IoShareSocialOutline size={24} />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center px-4 py-7">
        <div className="text-xl font-bold">Consolidado dos programas</div>
        <div className="flex items-center">
          <Button
            data-test="previous"
            variant="erpSecondary"
            size="icon"
            className="mx-2"
            onClick={() => handleChangePage('prev')}
            disabled={disablePrev}
          >
            <MdOutlineArrowLeft size={24} />
          </Button>
          <Button
            data-test="next"
            variant="erpSecondary"
            size="icon"
            onClick={() => handleChangePage('next')}
            disabled={disableNext}
          >
            <MdOutlineArrowRight size={24} />
          </Button>
        </div>
      </div>
      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{
            width: '100%',
            position: 'relative',
          }}
        >
          {(shared ? isLoadingConsolidatedShared : isLoadingConsolidated) ? (
            <LoadingTable />
          ) : (
            <TableContainer
              className="w-full"
              sx={{
                maxHeight: '438px !important',
                overflowY: 'scroll',
                position: 'relative',
              }}
            >
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
                size={'medium'}
                stickyHeader
              >
                <EnhancedTableHead headCells={headCells} />
                <TableBody id="tableBody">
                  {rows?.length ? (
                    rows.map((row: any) => {
                      return (
                        <ConsolidatedTableRow
                          key={row?.id}
                          row={row}
                          headCells={headCells}
                          page={page}
                        />
                      )
                    })
                  ) : (
                    <div className="p-4 text-erp-grayscale text-sm">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </TableBody>
                <EnhancedTableFooter headCells={headCells} />
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
      {!shared && (
        <ModalShareConsolidated
          open={modalOpenShareConsolidated}
          onClose={() => {
            setModalOpenShareConsolidated(false)
          }}
          budgetPlans={dataConsolidated?.budgetPlans || dataConsolidated?.data?.budgetPlans || []}
        />
      )}
      <ModalConfirm
        open={modalOpenConfirmExport}
        onClose={() => {
          setModalOpenConfirmExport(false)
        }}
        text={success ? 'Um link será enviado para o seu e-mail para download' : errorMessage}
        success={success}
      />
      {shared && (
        <ModalExportConsolidatedShared
          open={modalOpenExportShared}
          onClose={() => {
            setModalOpenExportShared(false)
          }}
        />
      )}
    </div>
  )
}
