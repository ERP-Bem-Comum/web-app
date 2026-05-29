'use client'
import { useGetBudgetPlans } from '@/services/budgetPlan'
import api from '@/services/api'
import { IProgram, useGetPrograms } from '@/services/programs'
import { IBudgetPlanTable } from '@/types/budgetPlan'
import { getYears } from '@/utils/dates'
import { calculateBudgetTotal } from '@/utils/budgetTotalCalculation'
import { statusBudgetList } from '@/utils/enums'
import useDebounce from '@/utils/use-debounce'
import {
  Autocomplete,
  Box,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import { LoadingTable } from '../table/loadingTable'
import TableHeadCellBudgetPlanStyled from '../table/TableHeadCellBudgetPlanStyled'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import BudgetPlanTableRow from './BudgetPlanTableRow'
import { ModalCreateBudgetPlan } from './ModalCreateBudgetPlan'

interface Data {
  id: number
  name: string
  year: number
  version: number
  program: { name: string }
  children: any
  total: string
  partners: string
  status: string
  updatedBy: string
  updatedAt: string
  options: string
}

function createData(
  id: number,
  name: string,
  year: number,
  version: number,
  program: { name: string },
  children: any,
  total: string,
  partners: string,
  status: string,
  updatedBy: string,
  updatedAt: string,
  options: string,
): Data {
  return {
    id,
    name,
    year,
    version,
    program,
    children,
    total,
    partners,
    status,
    updatedBy,
    updatedAt,
    options,
  }
}

interface HeadCell {
  id: keyof Data
  label: string
  align: any
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    align: 'left',
    label: 'PLANO ORÇAMENTÁRIO',
  },
  {
    id: 'total',
    align: 'left',
    label: 'TOTAL',
  },
  {
    id: 'partners',
    align: 'left',
    label: 'PARCEIROS',
  },
  {
    id: 'status',
    align: 'left',
    label: 'STATUS',
  },
  {
    id: 'options',
    align: 'center',
    label: '',
  },
]

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void
  order: 'asc' | 'desc'
  orderBy: string
  rowCount: number
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props
  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableHeadCellBudgetPlanStyled key={headCell.id} align={headCell.align}>
            <div style={{ fontWeight: 600 }}>{headCell.label}</div>
          </TableHeadCellBudgetPlanStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}

const calculateRealTotal = (budgetData: any): number => {
  return calculateBudgetTotal(budgetData)
}



export default function BudgetPlanTable() {
  const [modalOpenCreate, setModalOpenCreate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [orderBy] = useState('name')
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [rows, setRows] = useState<Data[]>([])
  const [openFilter, setOpenFilter] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>()
  const [filterStatus, setFilterStatus] = useState<string>()
  const [selectedYear, setSelectedYear] = useState<number>()
  const [filterYear, setFilterYear] = useState<number>()
  const [selectedProgram, setSelectedProgram] = useState<IProgram>()
  const [filterProgram, setFilterProgram] = useState<number>()
  const [budgetTotals, setBudgetTotals] = useState<{[key: number]: string}>({})
  const [dataVersion, setDataVersion] = useState(0)
  const [calculatingTotals, setCalculatingTotals] = useState<Set<number>>(new Set())
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)

  const { data, isLoading: isLoadingBudget } = useGetBudgetPlans({
    page,
    limit,
    search,
    year: filterYear,
    programId: filterProgram,
    status: filterStatus,
  })

  const { data: dataPrograms } = useGetPrograms({
    page: 1,
    limit: 99999999,
    search: '',
    active: 1,
  })

  const fetchRealTotals = async () => {
    if (!data?.items) return

    const totalsMap: {[key: number]: string} = {}

    // Process all items including children recursively
    const processItems = (items: any[]) => {
      const allItems: any[] = []

      const addItemsRecursively = (itemList: any[]) => {
        itemList.forEach(item => {
          allItems.push(item)
          if (item.children && item.children.length > 0) {
            addItemsRecursively(item.children)
          }
        })
      }

      addItemsRecursively(items)
      return allItems
    }

    const allItems = processItems(data.items)

    const calculatingSet = new Set(allItems.map(item => item.id))
    setCalculatingTotals(calculatingSet)

    for (const item of allItems) {
      try {
        const response = await api.get('/budgets', {
          params: {
            page: 1,
            budgetPlanId: item.id,
            isForMonth: 1,
          }
        })

        const budgetData = response.data
        const realTotal = calculateRealTotal(budgetData)
        totalsMap[item.id] = realTotal
          ? (realTotal / 100).toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })
          : 'R$ 0,00'

        setCalculatingTotals(prev => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
      } catch (error) {
        console.error(`Erro ao buscar total para budget ${item.id}:`, error)
        totalsMap[item.id] = 'R$ 0,00'

        setCalculatingTotals(prev => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
      }
    }

    setBudgetTotals(totalsMap)
  }

  useEffect(() => {
    const list = [] as Data[]

    setQntPage(data?.meta?.totalPages)

    data?.items?.forEach((x: IBudgetPlanTable) => {
      list.push(
        createData(
          x.id,
          x.year + ' ' + x.program?.name + ' ' + x.version.toFixed(1),
          x.year,
          x.version,
          x.program,
          x?.children,
          budgetTotals[x.id] || 'Calculando...',
          x.program?.name === 'EPV'
            ? x?.countPartnerMunicipalities + ' municípios'
            : x?.countPartnerStates + ' estados',
          x.status,
          x.updatedBy?.name,
          x.updatedAt ? format(new Date(x.updatedAt), 'dd/MM/yyyy HH:mm') : '',
          '',
        ),
      )
    })
    setRows(list)
  }, [data?.items, data?.meta?.totalPages, budgetTotals])

  useEffect(() => {
    if (data?.items) {
      setDataVersion(prev => prev + 1)
      setBudgetTotals({})
      setCalculatingTotals(new Set())
    }
  }, [data?.items])

  useEffect(() => {
    if (data?.items && data.items.length > 0 && dataVersion > 0) {
      // Check if we need to calculate totals for new items
      const processItems = (items: any[]): any[] => {
        const allItems: any[] = []
        const addItemsRecursively = (itemList: any[]) => {
          itemList.forEach(item => {
            allItems.push(item)
            if (item.children && item.children.length > 0) {
              addItemsRecursively(item.children)
            }
          })
        }
        addItemsRecursively(items)
        return allItems
      }

      const allItems = processItems(data.items)
      const hasUncalculatedTotals = allItems.some((item) => !budgetTotals[item.id] || budgetTotals[item.id] === 'Calculando...')

      if (hasUncalculatedTotals) {
        fetchRealTotals()
      }
    }
  }, [data?.items, dataVersion])

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [qntPage, page])

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    // setSelectedColumn(property)
  }

  const handleChangePage = (direction: string) => {
    if (direction === 'prev') {
      setPage(page - 1)
    } else {
      setPage(page + 1)
    }
  }

  const handleChangeLimit = (event: any) => {
    setLimit(parseInt(event.target.value))
    setPage(1)
  }

  const handleFilter = () => {
    setFilterStatus(selectedStatus)
    setFilterYear(selectedYear)
    setFilterProgram(selectedProgram?.id)
    setPage(1)
  }

  useEffect(() => {
    if (debouncedSearchTerm) {
      setSearch(debouncedSearchTerm)
    } else setSearch('')

    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  return (
    <div>
      <Card className="overflow-hidden">
        <CardHeader data-text="" className="p-4 flex items-center flex-row justify-between">
          <div className="flex items-center">
            <Button
              data-test="filter"
              size="none"
              variant="erpReturn"
              className="border-[#E0E4E4] me-4"
              onClick={() => setOpenFilter(!openFilter)}
            >
              <BiFilterAlt size={20} color={'#155366'} />
            </Button>
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
            <Button data-test="add" variant="erpPrimary" onClick={() => setModalOpenCreate(true)}>
              Criar Plano
            </Button>
          </div>
        </CardHeader>
        {openFilter && (
          <div className="bg-[#F6FAFB] flex p-4 w-full items-center">
            <Autocomplete
              id="status"
              size="small"
              noOptionsText="Ano"
              value={selectedYear}
              options={getYears()}
              onChange={(_event, newValue) => {
                setSelectedYear(newValue ?? undefined)
              }}
              renderInput={(params) => <TextField {...params} label="Ano" />}
              sx={{ width: 142, backgroundColor: '#fff', marginRight: '16px' }}
            />
            <Autocomplete
              id="status"
              size="small"
              noOptionsText="Programa"
              value={selectedProgram}
              options={dataPrograms?.items}
              getOptionLabel={(option: IProgram) => option?.name}
              onChange={(_event, newValue) => {
                setSelectedProgram(newValue ?? undefined)
              }}
              renderInput={(params) => <TextField {...params} label="Programa" />}
              sx={{ width: 142, backgroundColor: '#fff', marginRight: '16px' }}
            />
            <Autocomplete
              id="status"
              size="small"
              noOptionsText="Status"
              value={selectedStatus}
              options={Object.keys(statusBudgetList)}
              getOptionLabel={(option) => statusBudgetList[option]}
              onChange={(_event, newValue) => {
                setSelectedStatus(newValue ?? undefined)
              }}
              renderInput={(params) => <TextField {...params} label="Status" />}
              sx={{ width: 142, backgroundColor: '#fff', marginRight: '16px' }}
            />
            <Button variant="erpSecondary" onClick={() => handleFilter()}>
              Filtrar
            </Button>
          </div>
        )}
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
                    <EnhancedTableHead
                      order={order}
                      orderBy={orderBy}
                      onRequestSort={handleRequestSort}
                      rowCount={rows.length}
                    />
                    <TableBody id="tableBody" className="">
                      {rows?.length ? (
                        rows.map((row, index) => {
                          return <BudgetPlanTableRow key={row?.id} row={row} budgetTotals={budgetTotals} calculatingTotals={calculatingTotals} />
                        })
                      ) : (
                        <div className="p-4 text-erp-grayscale text-sm">
                          Nenhum resultado encontrado
                        </div>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <div className="flex justify-end items-center text-sm bg-[#F5F5F5] py-4 px-3 text-[#248DAD] flex-wrap">
                Itens por página:
                <select value={limit} onChange={handleChangeLimit}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <p
                  style={{
                    marginLeft: '25px',
                  }}
                ></p>
                {page} - {qntPage}
                <p
                  style={{
                    marginRight: '25px',
                  }}
                ></p>
                <button
                  onClick={() => handleChangePage('prev')}
                  disabled={disablePrev}
                  className="disabled:text-[#A1E5FA]"
                >
                  <MdNavigateBefore size={24} />
                </button>
                <button
                  onClick={() => handleChangePage('next')}
                  disabled={disableNext}
                  className="disabled:text-[#A1E5FA]"
                >
                  <MdNavigateNext size={24} />
                </button>
              </div>
            </Paper>
          </Box>
        </CardContent>
      </Card>
      <ModalCreateBudgetPlan open={modalOpenCreate} onClose={() => setModalOpenCreate(false)} />
    </div>
  )
}
