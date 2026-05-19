import { IResult } from '@/services/budget'
import { exportBudgetPlanCSV } from '@/services/budgetPlan'
import { useGetCostCenterActiveByBudgetPlan } from '@/services/costCenter'
import { IProgram } from '@/services/programs'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
import { Autocomplete, Menu, MenuItem, TextField } from '@mui/material'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MdOutlineMoreHoriz } from 'react-icons/md'
import { ModalConfirm } from '../../modals/ModalConfirm'
import { ModalQuestion } from '../../modals/ModalQuestion'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader } from '../../ui/card'
import BudgetTable from './BudgetTable'
import { ModalDeleteBudget } from './ModalDeleteBudget'

interface Params {
  budgetPlan: any
  budget: any
  program: IProgram
}

export default function BudgetDetail({ budgetPlan, budget, program }: Params) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [modalOpenAdd, setModalOpenAdd] = useState(false)
  const [modalOpenDeleteBudget, setModalOpenDeleteBudget] = useState(false)
  const [modalOpenConfirmExport, setModalOpenConfirmExport] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedCostCenter, setSelectedCostCenter] = useState<any>()
  const [filterCostCenter, setFilterCostCenter] = useState<any>()
  const [costCenterFiltered, setCostCenterFiltered] = useState([])
  const [showModalQuestionDiscard, setShowModalQuestionDiscard] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseOptions = () => {
    setAnchorEl(null)
  }

  const handleFilter = () => {
    setFilterCostCenter(selectedCostCenter)
  }

  const { data: dataAll, isLoading: isLoadingAll } = useGetCostCenterActiveByBudgetPlan(
    budget?.budgetPlanId,
  )

  useEffect(() => {
    if (dataAll?.costCenters) {
      setSelectedCostCenter(dataAll?.costCenters[0])
      setFilterCostCenter(dataAll?.costCenters[0])
    }
  }, [dataAll])

  useEffect(() => {
    setCostCenterFiltered(
      dataAll?.costCenters?.find((costCenter: any) => costCenter.id === filterCostCenter?.id),
    )
  }, [dataAll?.costCenters, filterCostCenter])

  const getTotalValue = () => {
    if (!budget?.budgetResults || budget?.budgetResults.length === 0) return 0

    return budget?.budgetResults?.reduce(
      (total: number, value: IResult) => total + Number(value?.valueInCents || 0),
      0,
    )
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

  const getName = () => {
    return (
      budgetPlan?.year +
      ' ' +
      program?.name +
      ' ' +
      budgetPlan?.version?.toFixed(1) +
      ' > ' +
      (budget?.partnerState
        ? budget?.partnerState?.name
        : budget?.partnerMunicipality
          ? budget?.partnerMunicipality?.name + ' - ' + budget?.partnerMunicipality?.uf
          : '')
    )
  }

  return (
    <div>
      <Card className="p-5">
        <CardHeader className="px-4">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex items-center">
              <div className="text-3xl me-2">{getName()}</div>
            </div>
            <div className="text-[#155366] text-xl">
              Total Orçamento: {formatCentsToCurrency(getTotalValue())}
            </div>
          </div>
          <div className="bg-erp-baseLight py-5 px-4 flex justify-between items-center">
            <div className="flex">
              {selectedCostCenter && (
                <Autocomplete
                  id="costCenter"
                  size="small"
                  fullWidth
                  noOptionsText="Centro de Custo"
                  value={selectedCostCenter}
                  inputValue={selectedCostCenter?.name}
                  options={dataAll?.costCenters}
                  disableClearable
                  getOptionLabel={(option) => option?.name}
                  isOptionEqualToValue={(option, value) => option === value}
                  onChange={(_event, newValue) => {
                    setSelectedCostCenter(newValue)
                  }}
                  renderInput={(params) => <TextField {...params} label="Centro de Custo" />}
                  loading={isLoadingAll}
                  sx={{
                    width: '380px',
                    backgroundColor: '#fff',
                    marginRight: '16px',
                  }}
                />
              )}
              <Button data-test="filter" variant="erpSecondary" onClick={() => handleFilter()}>
                Filtrar
              </Button>
            </div>
            <div className="flex">
              <Button
                data-test="discard"
                variant="ghost"
                className="mr-3"
                onClick={() => setShowModalQuestionDiscard(true)}
              >
                Descartar Alterações
              </Button>
              <Button
                data-test="save"
                variant="erpPrimary"
                className="mr-3"
                onClick={() => setModalOpenAdd(true)}
              >
                Salvar
              </Button>
              <Button
                data-test="more"
                variant="erpSecondary"
                onClick={(e) => {
                  handleOpenOptions(e)
                }}
              >
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
                  onClick={() => handleExport()}
                  disabled={isDisabled}
                >
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Exportar CSV
                </MenuItem>
                <MenuItem sx={{ fontSize: '14px' }} onClick={() => setModalOpenDeleteBudget(true)}>
                  Excluir Orçamento
                </MenuItem>
              </Menu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BudgetTable
            budget={budget}
            costCenter={costCenterFiltered}
            budgetPlanName={getName()}
            allCostCenters={dataAll?.costCenters}
            status={budgetPlan?.status}
            programName={program?.name}
          />
        </CardContent>
      </Card>
      <ModalQuestion
        open={showModalQuestionDiscard}
        onConfirm={() => {
          router.back()
          setShowModalQuestionDiscard(false)
        }}
        onClose={() => {
          setShowModalQuestionDiscard(false)
        }}
        text={`Ao confirmar essa opção todas as suas alterações serão perdidas.`}
        textConfirm="Sim, descartar alterações"
        textCancel="Não descartar alterações"
      />
      <ModalDeleteBudget
        open={modalOpenDeleteBudget}
        onClose={() => setModalOpenDeleteBudget(false)}
        budgetId={budget?.id}
        budgetName={
          budget?.partnerState
            ? budget?.partnerState?.name
            : budget?.partnerMunicipality?.name + ' - ' + budget?.partnerMunicipality?.uf
        }
      />
      <ModalConfirm
        open={modalOpenConfirmExport}
        onClose={() => {
          setModalOpenConfirmExport(false)
        }}
        text={success ? 'Um link será enviado para o seu e-mail para download' : errorMessage}
        success={success}
      />
    </div>
  )
}
