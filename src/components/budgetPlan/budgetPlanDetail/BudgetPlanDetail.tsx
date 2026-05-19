/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetBudgets } from '@/services/budget'
import { approveBudgetPlan, exportBudgetPlanCSV } from '@/services/budgetPlan'
import { ICity, useGetCities } from '@/services/city'
import { useGetProgramById } from '@/services/programs'
import { IState, useGetStates } from '@/services/state'
import { statusBudgetList } from '@/utils/enums'
import { Autocomplete, Menu, MenuItem, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MdOutlineMoreHoriz } from 'react-icons/md'
import { PiChartLineUp } from 'react-icons/pi'
import { ModalAddBudget } from '../ModalAddBudget'
import { ModalCreateCalibration } from '../ModalCreateCalibration'
import { ModalCreateScenery } from '../ModalCreateScenery'
import { ModalDeleteBudgetPlan } from '../ModalDeleteBudgetPlan'
import { ModalShareBudgetPlan } from '../ModalShareBudgetPlan'
import BudgetPlanDetailTable from './BudgetPlanDetailTable'
import { ModalInsightBudgetPlan } from './ModalinsightBudgetPlan'
import { useOptions } from '@/hooks/useOptions'
import { calculateTotalFromBudgetData, formatBudgetTotal } from '@/utils/budgetCalculations'

interface Params {
  budget: any
}

export default function BudgetPlanDetail({ budget }: Params) {
  const [page, setPage] = useState(1)
  const [isDisabled, setIsDisabled] = useState(false)
  const [selectedState, setSelectedState] = useState<IState | null>()
  const [selectedCity, setSelectedCity] = useState<ICity | null>()
  const [selectedCityInput, setSelectedCityInput] = useState<string | undefined>('')
  const [filterState, setFilterState] = useState<IState | null>()
  const [filterCity, setFilterCity] = useState<ICity | null>()
  const [modalOpenAdd, setModalOpenAdd] = useState(false)
  const [modalOpenCreate, setModalOpenCreate] = useState(false)
  const [modalOpenDelete, setModalOpenDelete] = useState(false)
  const [modalOpenCreateCalibration, setModalOpenCreateCalibration] = useState(false)
  const [showModalQuestionApprove, setShowModalQuestionApprove] = useState(false)
  const [modalOpenConfirmExport, setModalOpenConfirmExport] = useState(false)
  const [modalOpenInsight, setModalOpenInsight] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [modalOpenShare, setModalOpenShare] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isForMonth, setIsForMonth] = useState(1)
  const open = Boolean(anchorEl)
  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseOptions = () => {
    setAnchorEl(null)
  }

  const { refetch } = useOptions()

  const { data: dataProgram } = useGetProgramById(budget?.programId)
  const { data: dataState, isLoading: isLoadingStates } = useGetStates()
  const { data: dataCity, isLoading: isLoadingCities } = useGetCities({
    page: 1,
    limit: 99999999,
    uf: selectedState?.abbreviation,
  })

  const { data } = useGetBudgets({
    page,
    budgetPlanId: budget?.id,
    partnerStateId: filterState?.id,
    partnerMunicipalityId: filterCity?.id,
    isForMonth,
  })

  const handleFilter = () => {
    if (dataProgram?.program?.name === 'EPV') {
      setFilterCity(selectedCity)
    } else {
      setFilterState(selectedState)
    }
    setIsForMonth(1)
  }

  useEffect(() => {
    setSelectedCityInput('')
  }, [selectedState])

  const handleApprove = async () => {
    let response
    try {
      response = await approveBudgetPlan(budget?.id)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setSuccess(false)
      setErrorMessage(response.message)
    } else {
      setSuccess(true)

      queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
      queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
      refetch.refetchBudgetPlanAndNested()
    }
    setShowModalConfirm(true)
  }

  const getDisableCalibration = (budget: any) => {
    let count = 0
    budget?.children?.forEach((child: any) => {
      if (child.status === 'EM_CALIBRACAO') count += 1
    })

    if (count >= 1) {
      return true
    }

    return false
  }

  const handleExport = async () => {
    setIsDisabled(true)
    let response = null
    try {
      response = await exportBudgetPlanCSV(budget?.id)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }
    if (!response?.data?.message) {
      setModalOpenConfirmExport(true)
      setSuccess(true)
    } else {
      setSuccess(false)
      setModalOpenConfirmExport(true)
      setErrorMessage(response.data.message || 'Erro ao exportar dados')
    }
  }
  return (
    <div>
      <Card className="p-5">
        <CardHeader className="px-4">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex items-center">
              <div className="text-3xl me-2">
                {budget?.year} {dataProgram?.program?.name} {budget?.version.toFixed(1)}
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
               {formatBudgetTotal(calculateTotalFromBudgetData(data, isForMonth))}
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
              {dataProgram?.program?.name === 'EPV' && (
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
                data-test="addBudget"
                variant="erpSecondary"
                className="mr-3"
                onClick={() => setModalOpenAdd(true)}
                disabled={budget?.status === 'APROVADO'}
              >
                Adicionar Orçamento
              </Button>
              <Button data-test="more" variant="erpSecondary" onClick={handleOpenOptions}>
                <MdOutlineMoreHoriz size={18} />
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseOptions}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => {
                    setModalOpenShare(true)
                  }}
                  hidden={budget?.status !== 'APROVADO'}
                >
                  Compartilhar
                </MenuItem>
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => null}
                  hidden={budget?.status !== 'APROVADO'}
                >
                  Planejado x Realizado
                </MenuItem>
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => handleExport()}
                  disabled={isDisabled}
                  hidden={budget?.status !== 'APROVADO'}
                >
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Exportar CSV
                </MenuItem>
                {budget.version.toString().length === 1 && (
                  <MenuItem
                    sx={{ fontSize: '14px' }}
                    onClick={() => setModalOpenCreateCalibration(true)}
                    disabled={getDisableCalibration(budget)}
                    hidden={budget?.status !== 'APROVADO'}
                  >
                    Iniciar Calibração
                  </MenuItem>
                )}

                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => {
                    setModalOpenShare(true)
                  }}
                  hidden={budget?.status === 'APROVADO'}
                >
                  Compartilhar plano
                </MenuItem>
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => setShowModalQuestionApprove(true)}
                  hidden={budget?.status === 'APROVADO'}
                >
                  Aprovar Plano
                </MenuItem>
                {budget?.version.toString().length === 1 && (
                  <MenuItem
                    sx={{ fontSize: '14px' }}
                    onClick={() => setModalOpenCreate(true)}
                    hidden={budget?.status === 'APROVADO'}
                  >
                    Criar cenário desse plano
                  </MenuItem>
                )}
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => handleExport()}
                  disabled={isDisabled}
                  hidden={budget?.status === 'APROVADO'}
                >
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Exportar CSV
                </MenuItem>
                <MenuItem
                  sx={{ fontSize: '14px' }}
                  onClick={() => setModalOpenDelete(true)}
                  hidden={budget?.status === 'APROVADO'}
                >
                  Excluir Plano
                </MenuItem>
              </Menu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BudgetPlanDetailTable
            budgetPlan={budget}
            program={dataProgram?.program}
            partnerState={filterState}
            partnerMunicipality={filterCity}
            budgets={data}
            changePage={setPage}
            isForMonth={isForMonth === 1}
            changeIsForMonth={setIsForMonth}
          />
        </CardContent>
      </Card>
      <ModalAddBudget
        open={modalOpenAdd}
        onClose={() => setModalOpenAdd(false)}
        budgetPlan={budget}
        program={dataProgram?.program?.name}
        partners={data?.items}
      />
      <ModalQuestion
        open={showModalQuestionApprove}
        onConfirm={() => {
          handleApprove()
        }}
        onClose={() => {
          setShowModalQuestionApprove(false)
        }}
        text={`Tem certeza que quer aprovar o Plano Orçamentário “${
          budget?.year + ' ' + dataProgram?.program?.name + ' ' + budget?.version.toFixed(1)
        }”?`}
        textConfirm="Aprovar"
        textCancel="Cancelar"
      />
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          setShowModalQuestionApprove(false)
        }}
        text={success ? 'Plano Orçamentário aprovado com sucesso!' : errorMessage}
        success={success}
      />
      <ModalDeleteBudgetPlan
        open={modalOpenDelete}
        onClose={() => setModalOpenDelete(false)}
        budgetId={budget?.id}
        budgetName={budget?.year + ' ' + dataProgram?.program?.name + ' ' + budget?.version}
        haveChildren={!!budget?.children}
        redirect={true}
      />
      <ModalCreateScenery
        open={modalOpenCreate}
        onClose={() => setModalOpenCreate(false)}
        budgetPlanId={budget?.id}
      />
      <ModalCreateCalibration
        open={modalOpenCreateCalibration}
        onClose={() => setModalOpenCreateCalibration(false)}
        budget={{ ...budget, program: dataProgram?.program }}
      />
      <ModalShareBudgetPlan
        open={modalOpenShare}
        onClose={() => setModalOpenShare(false)}
        budgetPlanId={budget?.id}
      />
      <ModalConfirm
        open={modalOpenConfirmExport}
        onClose={() => {
          setModalOpenConfirmExport(false)
        }}
        text={success ? 'Um link será enviado para o seu e-mail para download' : errorMessage}
        success={success}
      />
      <ModalInsightBudgetPlan
        open={modalOpenInsight}
        onClose={() => setModalOpenInsight(false)}
        budgetId={budget?.id}
      />
    </div>
  )
}
