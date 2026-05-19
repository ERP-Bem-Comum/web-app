import { approveBudgetPlan, exportBudgetPlanCSV } from '@/services/budgetPlan'
import { IBudgetPlanTable } from '@/types/budgetPlan'
import { statusBudgetList } from '@/utils/enums'
import { Menu, MenuItem, TableRow } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { MdOutlineExpandLess, MdOutlineExpandMore, MdOutlineMoreHoriz } from 'react-icons/md'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import TableCellStyled from '../table/TableCellStyled'
import { Button } from '../ui/button'
import BudgetTableRowSub from './ButgetPlanTableRowSub'
import { ModalCreateCalibration } from './ModalCreateCalibration'
import { ModalCreateScenery } from './ModalCreateScenery'
import { ModalDeleteBudgetPlan } from './ModalDeleteBudgetPlan'
import { ModalShareBudgetPlan } from './ModalShareBudgetPlan'
import { useOptions } from '@/hooks/useOptions'

interface Data {
  id: number
  name: string
  children: IBudgetPlanTable[]
  total: string
  partners: string
  status: string
  updatedBy: string
  updatedAt: string
  options: string
}

interface Params {
  row: Data
  budgetTotals?: {[key: number]: string}
  calculatingTotals?: Set<number>
}

export default function BudgetPlanTableRow({ row, budgetTotals, calculatingTotals }: Params) {
  const router = useRouter()
  const [openSub, setOpenSub] = useState(false)
  const [showModalQuestionApprove, setShowModalQuestionApprove] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [modalOpenConfirmExport, setModalOpenConfirmExport] = useState(false)
  const [modalOpenCreate, setModalOpenCreate] = useState(false)
  const [modalOpenCreateCalibration, setModalOpenCreateCalibration] = useState(false)
  const [modalOpenDelete, setModalOpenDelete] = useState(false)
  const [modalOpenShare, setModalOpenShare] = useState(false)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseOptions = () => {
    setAnchorEl(null)
  }

  const { refetch } = useOptions()

  const handleApprove = async () => {
    let response
    try {
      response = await approveBudgetPlan(row?.id)
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

  const getDisableCalibration = (row: Data) => {
    let count = 0
    row.children.forEach((child) => {
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
      response = await exportBudgetPlanCSV(row?.id)
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

  const labelId = `enhanced-table-checkbox-${row?.id}`

  return (
    <Fragment>
      <TableRow key={labelId} tabIndex={-1} className="hover:bg-[#F6FAFB]">
        <TableCellStyled
          onClick={() => router.push(`/planejamento/detalhes/${row.id}`)}
          border={false}
        >
          <div className="flex items-center">
            {row.children.length > 0 && (
              <Button
                variant="ghost"
                data-test={`openSub-${row.id}`}
                size="icon"
                onClick={(e) => {
                  setOpenSub(!openSub)
                  e.stopPropagation()
                }}
              >
                {openSub ? <MdOutlineExpandLess size={24} /> : <MdOutlineExpandMore size={24} />}
              </Button>
            )}{' '}
            {row.name}
          </div>
        </TableCellStyled>
        <TableCellStyled border={false}>
          <div className="flex items-center gap-2">
            {calculatingTotals?.has(row.id) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-erp-primary" />
                <span className="text-gray-500">Calculando...</span>
              </>
            ) : (
              budgetTotals?.[row.id] || row.total
            )}
          </div>
        </TableCellStyled>
        <TableCellStyled border={false}>{row.partners}</TableCellStyled>
        <TableCellStyled border={false}>
          <div>
            <div
              className={`rounded-md px-[5px] py-[3px] w-fit mb-2 ${
                row.status === 'APROVADO'
                  ? 'bg-erp-success text-[#FEFFFF]'
                  : row.status === 'EM_CALIBRACAO'
                    ? 'bg-erp-info text-[#EBF9FE]'
                    : 'bg-[#E0E4E4] text-[#364E55]'
              }`}
            >
              {statusBudgetList[row.status]}
            </div>
            <div>
              {row.updatedBy} alteração {row.updatedAt}
            </div>
          </div>
        </TableCellStyled>
        <TableCellStyled border={false}>
          <button
            data-test="buttonMore"
            className="bg-[#EBF9FE] w-8 h-8 rounded-md flex justify-center items-center border border-solid border-[#E0E4E4]"
            onClick={(e) => {
              handleOpenOptions(e)
            }}
          >
            <MdOutlineMoreHoriz size={20} />
          </button>
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
              data-test="menu-share"
              sx={{ fontSize: '14px' }}
              onClick={() => {
                setModalOpenShare(true)
              }}
              hidden={row.status !== 'APROVADO'}
            >
              Compartilhar plano
            </MenuItem>
            <MenuItem
              data-test="menu-plan-realized"
              sx={{ fontSize: '14px' }}
              onClick={() => null}
              hidden={row.status !== 'APROVADO'}
            >
              Planejado x Realizado
            </MenuItem>
            <MenuItem
              data-test="menu-calibration"
              sx={{ fontSize: '14px' }}
              onClick={() => setModalOpenCreateCalibration(true)}
              disabled={getDisableCalibration(row)}
              hidden={row.status !== 'APROVADO'}
            >
              Iniciar Calibração
            </MenuItem>

            <MenuItem
              data-test="menu-share"
              sx={{ fontSize: '14px' }}
              onClick={() => {
                setModalOpenShare(true)
              }}
              hidden={row.status === 'APROVADO'}
            >
              Compartilhar plano
            </MenuItem>
            <MenuItem
              data-test="menu-approve"
              sx={{ fontSize: '14px' }}
              onClick={() => {
                setShowModalQuestionApprove(true)
              }}
              hidden={row.status === 'APROVADO'}
            >
              Aprovar Plano
            </MenuItem>
            <MenuItem
              data-test="menu-cenario"
              sx={{ fontSize: '14px' }}
              onClick={() => setModalOpenCreate(true)}
            >
              Criar cenário desse plano
            </MenuItem>
            <MenuItem
              data-test="menu-export"
              sx={{ fontSize: '14px' }}
              onClick={() => handleExport()}
              disabled={isDisabled}
            >
              {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Exportar CSV
            </MenuItem>
            <MenuItem
              data-test="menu-delete"
              sx={{ fontSize: '14px' }}
              onClick={() => setModalOpenDelete(true)}
              hidden={row.status === 'APROVADO'}
            >
              Excluir Plano
            </MenuItem>
          </Menu>
        </TableCellStyled>
      </TableRow>
      {openSub &&
        row.children?.map((child: IBudgetPlanTable) => (
          <BudgetTableRowSub key={`sub-${child?.id}`} row={child} fatherStatus={row.status} budgetTotals={budgetTotals} calculatingTotals={calculatingTotals} />
        ))}
      <ModalQuestion
        open={showModalQuestionApprove}
        onConfirm={() => {
          handleApprove()
        }}
        onClose={() => {
          setShowModalQuestionApprove(false)
        }}
        text={`Tem certeza que quer aprovar o Plano Orçamentário “${row.name}”?`}
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
      <ModalCreateScenery
        open={modalOpenCreate}
        onClose={() => setModalOpenCreate(false)}
        budgetPlanId={row?.id}
      />
      <ModalCreateCalibration
        open={modalOpenCreateCalibration}
        onClose={() => setModalOpenCreateCalibration(false)}
        budget={row}
      />
      <ModalDeleteBudgetPlan
        open={modalOpenDelete}
        onClose={() => setModalOpenDelete(false)}
        budgetId={row?.id}
        budgetName={row?.name}
        haveChildren={!!row?.children}
      />
      <ModalShareBudgetPlan
        open={modalOpenShare}
        onClose={() => setModalOpenShare(false)}
        budgetPlanId={row?.id}
      />
      <ModalConfirm
        open={modalOpenConfirmExport}
        onClose={() => {
          setModalOpenConfirmExport(false)
        }}
        text={success ? 'Um link será enviado para o seu e-mail para download' : errorMessage}
        success={success}
      />
    </Fragment>
  )
}
