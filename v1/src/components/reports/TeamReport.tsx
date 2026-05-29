'use client'
import {
  Box,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TextField,
} from '@mui/material'
import { Card, CardContent, CardHeader } from '../ui/card'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import useDebounce from '@/utils/use-debounce'
import { LoadingTable } from '../table/loadingTable'
import { saveAs } from 'file-saver'

import { educationCalculationList, genderList, raceList, roleList } from '@/utils/enums'
import { getExportCollaborator } from '@/services/collaborator'
import { Button } from '../ui/button'
import { useGetTeamReport } from '@/services/reports'
import { TeamData } from '@/types/reports/team'
import { SetRow } from './components/team/setRow'
import { TeamTableHead } from './components/team/TeamTableHead'
import { TeamReportsFilter } from './filters/TeamReportsFilter'
import TeamCharts from './components/team/TeamCharts'
import { exportChartPDF } from '@/utils/export-pdf'

function createData(
  id: number,
  name: string,
  dateOfBirth: number,
  occupationArea: string,
  role: string,
  employmentRelationship: string,
  genderIdentity: string | null,
  race: string | null,
  education: string | null,
): TeamData {
  return {
    id,
    name,
    dateOfBirth,
    occupationArea,
    role,
    employmentRelationship,
    genderIdentity,
    race,
    education,
  }
}

export default function TeamReport() {
  const [searchTerm, setSearchTerm] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [rows, setRows] = useState<TeamData[]>([])
  const [openFilter, setOpenFilter] = useState(true)
  const [filterStatus, setFilterStatus] = useState<number | null>()
  const [filterEducation, setFilterEducation] = useState<string[]>([])
  const [filterYear, setFilterYear] = useState<string | null>()
  const [filterRace, setFilterRace] = useState<string[]>([])
  const [filterDisabled, setFilterDisabled] = useState<string[]>([])
  const [filterProgram, setFilterProgram] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<string[]>([])
  const [filterGender, setFilterGender] = useState<string[]>([])
  const [filterAge, setFilterAge] = useState<string>()
  const [filterEmployment, setFilterEmployment] = useState<string[]>([])
  const [filterSituation, setFilterSituation] = useState<string[]>([])
  const [isOpenCharts, setIsOpenCharts] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 1000)

  const { data, isLoading: isLoadingUsers } = useGetTeamReport({
    page,
    limit,
    search,
    age: filterAge,
    yearOfContract: filterYear,
    genderIdentities: filterGender,
    breeds: filterRace,
    educations: filterEducation,
    status: filterSituation,
    occupationAreas: filterProgram,
    employmentRelationships: filterEmployment,
    disableBy: filterDisabled,
    roles: filterRole,
    active: filterStatus,
  })

  useEffect(() => {
    const list = [] as TeamData[]

    setQntPage(data?.meta?.totalPages ?? 1)

    data?.items?.forEach((x) => {
      const age = x.dateOfBirth
        ? new Date().getFullYear() - new Date(x.dateOfBirth).getFullYear()
        : 0
      list.push(
        createData(
          x.id,
          x.name,
          age,
          x.occupationArea,
          x.role,
          x.employmentRelationship,
          x.genderIdentity !== null ? genderList[x.genderIdentity] : 'N/A',
          x.race !== null ? raceList[x.race] : 'N/A',
          x.education !== null ? educationCalculationList[x.education] : 'N/A',
        ),
      )
    })
    setRows(list)
  }, [data?.items, data?.meta?.totalPages])
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

  const handleChangeLimit = (event: any) => {
    setLimit(parseInt(event.target.value))
    setPage(1)
  }

  const handleFilter = (formData: any) => {
    setFilterStatus(formData.status === 'Ativo' ? 1 : formData.status === 'Inativo' ? 0 : null)
    setFilterEducation(formData.education || [])
    setFilterYear(formData.year ? formData.year.getFullYear().toString() : null)
    setFilterRace(formData.race || [])
    setFilterDisabled(formData.disabled || [])
    setFilterProgram(formData.program || [])
    setFilterRole(formData.role || [])
    setFilterGender(formData.gender || [])
    setFilterAge(formData.age)
    setFilterEmployment(formData.employment || [])
    setFilterSituation(formData.situation || [])
    setPage(1)
  }

  useEffect(() => {
    if (debouncedSearchTerm) {
      setSearch(debouncedSearchTerm)
    } else setSearch('')

    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  const handleExport = async () => {
    const resp = await getExportCollaborator({
      page: 1,
      limit: 9999999,
      search,
      age: filterAge,
      yearOfContract: filterYear,
      genderIdentities: filterGender,
      breeds: filterRace,
      educations: filterEducation,
      status: filterSituation,
      occupationAreas: filterProgram,
      employmentRelationships: filterEmployment,
      disableBy: filterDisabled,
      roles: filterRole,
      active: filterStatus,
    })
    saveAs(resp?.data, 'Colaboradores.csv')
  }

  const handleExportPDF = () => {
    exportChartPDF('grafico_equipe')
  }

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
        </CardHeader>
        <TeamReportsFilter
          openFilter={openFilter}
          onFilter={handleFilter}
          onExport={isOpenCharts ? handleExportPDF : handleExport}
          onCharts={() => setIsOpenCharts(!isOpenCharts)}
          openCharts={isOpenCharts}
        />
        {isOpenCharts ? (
          <TeamCharts data={data?.items} />
        ) : (
          <CardContent className="p-0">
            <Box sx={{ width: '100%' }}>
              <Paper
                sx={{
                  width: '100%',
                }}
              >
                {isLoadingUsers ? (
                  <LoadingTable />
                ) : (
                  <TableContainer className="w-full overflow-auto">
                    <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                      <TeamTableHead />
                      <TableBody id="tableBody" className="">
                        {rows?.length ? (
                          rows.map((row, index) => {
                            return SetRow(row, index)
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
        )}
      </Card>
    </div>
  )
}
