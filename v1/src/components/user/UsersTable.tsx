'use client'
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
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import { useGetUsers } from '@/services/user'
import TableCellStyled from '../table/TableCellStyled'
import useDebounce from '@/utils/use-debounce'
import { LoadingTable } from '../table/loadingTable'
import TableHeadCellStyled from '../table/TableHeadCellStyled'

interface Data {
  id: string
  name: string
  perfil: string
  active: boolean
}

function createData(id: string, name: string, perfil: string, active: boolean): Data {
  return {
    id,
    name,
    perfil,
    active,
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
    label: 'NOME',
  },
  {
    id: 'perfil',
    align: 'left',
    label: 'PERFIL',
  },
  {
    id: 'active',
    align: 'left',
    label: 'STATUS',
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
          <TableHeadCellStyled key={headCell.id} align={headCell.align}>
            <div style={{ fontWeight: 600 }}>{headCell.label}</div>
          </TableHeadCellStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default function UsersTable() {
  const router = useRouter()
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>('Todos')
  const [filterStatus, setFilterStatus] = useState<number | null>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)

  const { data, isLoading: isLoadingUsers } = useGetUsers({
    page,
    limit,
    search,
    active: filterStatus,
  })

  useEffect(() => {
    const list = [] as Data[]

    setQntPage(data?.meta?.totalPages)

    data?.items?.forEach((x: Data) => {
      list.push(createData(x.id, x.name, x?.perfil, x.active))
    })
    setRows(list)
  }, [data?.items, data?.meta?.totalPages])

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

  const setRow = (row: Data, index: number) => {
    const labelId = `enhanced-table-checkbox-${index}`
    return (
      <TableRow
        key={labelId}
        tabIndex={-1}
        className="hover:bg-[#F6FAFB]"
        onClick={() => router.push(`/usuarios/detalhes/${row?.id}`)}
      >
        <TableCellStyled border={false}>{row.name}</TableCellStyled>
        <TableCellStyled>{row.perfil}</TableCellStyled>
        <TableCellStyled>{row.active ? 'Ativo' : 'Inativo'}</TableCellStyled>
      </TableRow>
      // </Link>
    )
  }

  const handleFilter = () => {
    if (selectedStatus === 'Ativo') setFilterStatus(1)
    else if (selectedStatus === 'Inativo') setFilterStatus(0)
    else setFilterStatus(null)
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
            <Button
              data-test="add"
              variant="erpPrimary"
              onClick={() => router.push('/usuarios/adicionar')}
            >
              Adicionar Usuário
            </Button>
          </div>
        </CardHeader>
        {openFilter && (
          <div className="bg-[#F6FAFB] flex p-4 w-full items-center">
            <Autocomplete
              id="status"
              size="small"
              noOptionsText="Status"
              value={selectedStatus}
              options={['Ativo', 'Inativo']}
              // getOptionLabel={(option) => option.name}
              onChange={(_event, newValue) => {
                setSelectedStatus(newValue)
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
                // borderBottomLeftRadius: '10px',
                // borderBottomRightRadius: '10px',
              }}
            >
              {isLoadingUsers ? (
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
                          return setRow(row, index)
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
    </div>
  )
}
