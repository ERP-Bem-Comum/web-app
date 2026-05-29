import { useEffect, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { IState } from '@/services/state'
import { ICity } from '@/services/city'
import { PiChartLineUp } from 'react-icons/pi'
import { MdOutlineDownload } from 'react-icons/md'
import { statusBudgetList } from '@/utils/enums'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BudgetPlanDetailTable from '../budgetPlanDetail/BudgetPlanDetailTable'
import {
  useGetBudgetsShared,
  useGetCitiesShared,
  useGetStatesShared,
} from '@/services/budgetPlanShared'
import { ModalEmailExportShared } from './ModalEmailExportShared'
import { ModalInsightBudgetPlan } from '../budgetPlanDetail/ModalinsightBudgetPlan'
import { Loader2 } from 'lucide-react'
import { calculateTotalFromBudgetData, formatBudgetTotal } from '@/utils/budgetCalculations'

interface Params {
  budget: any
}

export default function BudgetPlanDetailShared({ budget }: Params) {
  const [page, setPage] = useState(1)
  const [selectedState, setSelectedState] = useState<IState | null>()
  const [selectedCity, setSelectedCity] = useState<ICity | null>()
  const [selectedCityInput, setSelectedCityInput] = useState<string | undefined>('')
  const [filterState, setFilterState] = useState<IState | null>()
  const [filterCity, setFilterCity] = useState<ICity | null>()
  const [openExport, setOpenExport] = useState(false)
  const [modalOpenInsight, setModalOpenInsight] = useState(false)
  const [isForMonth, setIsForMonth] = useState(1)

  const { data: dataState, isLoading: isLoadingStates } = useGetStatesShared()
  const { data: dataCity, isLoading: isLoadingCities } = useGetCitiesShared({
    page: 1,
    limit: 99999999,
    uf: selectedState?.abbreviation,
  })

  const { data, isLoading } = useGetBudgetsShared({
    page,
    budgetPlanId: budget?.id,
    partnerStateId: filterState?.id,
    partnerMunicipalityId: filterCity?.id,
    isForMonth,
  })

  const handleFilter = () => {
    if (budget?.program?.name === 'EPV') {
      setFilterCity(selectedCity)
    } else {
      setFilterState(selectedState)
    }
  }

  useEffect(() => {
    setSelectedCityInput('')
  }, [selectedState])

  return (
    <div>
      <Card className="p-5">
        <CardHeader className="px-4">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex items-center">
              <div className="text-3xl me-2">
                {budget?.year} {budget?.program?.name} {budget?.version.toFixed(1)}
              </div>
              <div
                className={`rounded-md text-sm px-[8px] py-[5px] w-fit ${
                  budget?.status === 'APROVADO'
                    ? 'bg-erp-success text-[#FEFFFF]'
                    : budget?.status === 'EM_CALIBRACAO'
                      ? 'bg-erp-info text-[#EBF9FE]'
                      : 'bg-[#E0E4E4] text-[#364E55]'
                }`}
              >
                {statusBudgetList[budget?.status]}
              </div>
            </div>
            <div className="text-[#155366] text-xl">
              Total Plano:{' '}
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-erp-primary" />
                  <span className="text-gray-500">Calculando...</span>
                </div>
              ) : (
                formatBudgetTotal(calculateTotalFromBudgetData(data, isForMonth))
              )}
            </div>
          </div>
          <div className="bg-erp-baseLight py-5 px-4 flex justify-between items-center">
            <div className="flex">
              <Autocomplete
                id="state"
                size="small"
                noOptionsText="Estado"
                value={selectedState}
                options={dataState?.data ? dataState?.data : []}
                getOptionLabel={(option) => option?.name}
                onChange={(_event, newValue) => {
                  setSelectedState(newValue)
                  setSelectedCity(null)
                  setSelectedCityInput('')
                }}
                loading={isLoadingStates}
                renderInput={(params) => <TextField {...params} label="Estado" />}
                sx={{
                  width: 142,
                  backgroundColor: '#fff',
                  marginRight: '16px',
                }}
              />
              {budget?.program?.name === 'EPV' && (
                <Autocomplete
                  id="city"
                  size="small"
                  noOptionsText="Município"
                  value={selectedCity}
                  inputValue={selectedCityInput}
                  onInputChange={(event, newInputValue) => {
                    setSelectedCityInput(newInputValue)
                  }}
                  options={dataCity?.items ? dataCity.items : []}
                  getOptionLabel={(option) => option?.name}
                  onChange={(_event, newValue) => {
                    setSelectedCity(newValue)
                  }}
                  loading={isLoadingCities}
                  renderInput={(params) => (
                    <TextField {...params} label="Município" value={selectedCity} />
                  )}
                  sx={{
                    width: 142,
                    backgroundColor: '#fff',
                    marginRight: '16px',
                  }}
                  disabled={!selectedState}
                />
              )}
              <Button data-test="filter" variant="erpSecondary" onClick={() => handleFilter()}>
                Filtrar
              </Button>
            </div>
            <div className="flex">
              <Button
                data-test="insights"
                variant="erpSecondary"
                className="mr-3"
                onClick={() => setModalOpenInsight(true)}
              >
                Insights <PiChartLineUp size={18} className="ms-1" />
              </Button>
              <Button
                data-test="export"
                variant="erpSecondary"
                className="mr-3"
                onClick={() => setOpenExport(true)}
              >
                Exportar CSV <MdOutlineDownload size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BudgetPlanDetailTable
            budgetPlan={budget}
            program={budget?.program}
            partnerState={filterState}
            partnerMunicipality={filterCity}
            budgets={data}
            changePage={setPage}
            isForMonth={isForMonth === 1}
            changeIsForMonth={setIsForMonth}
            shared
          />
        </CardContent>
      </Card>
      <ModalEmailExportShared
        open={openExport}
        onClose={() => setOpenExport(false)}
        budgetId={budget?.id}
      />
      <ModalInsightBudgetPlan
        open={modalOpenInsight}
        onClose={() => setModalOpenInsight(false)}
        budgetId={budget?.id}
        shared
      />
    </div>
  )
}
