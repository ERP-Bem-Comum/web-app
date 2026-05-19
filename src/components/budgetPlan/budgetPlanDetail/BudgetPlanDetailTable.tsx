'use client'
import { ModalCostCenter } from '@/components/costCenter/ModalCostCenter'
import { LoadingTable } from '@/components/table/loadingTable'
import TableHeadCellBudgetStyled from '@/components/table/TableHeadCellBudgetStyled'
import { Button } from '@/components/ui/button'

import { getMonths } from '@/utils/dates'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import { MdOutlineArrowLeft, MdOutlineArrowRight } from 'react-icons/md'
import { ModalCostCenterShared } from '../budgetPlanShared/ModalCostCenterShared'
import BudgetPlanDetailTableRow from './BudgetPlanDetailTableRow'

interface Params {
  budgetPlan: any
  program: any
  partnerState: any
  partnerMunicipality: any
  budgets: any
  changePage: any
  shared?: boolean
  isForMonth: boolean
  changeIsForMonth: any
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
    <TableFooter>
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

export default function BudgetPlanDetailTable({
  budgetPlan,
  program,
  partnerState,
  partnerMunicipality,
  budgets,
  changePage,
  shared = false,
  isForMonth = true,
  changeIsForMonth,
}: Params) {
  const [modalOpenCostCentral, setModalOpenCostCentral] = useState(false)
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [headCells, setHeadCells] = useState<HeadCell[]>([])
  const [rows, setRows] = useState<any>([])
  const [isFilter, setIsFilter] = useState(false)
  const [title, setTitle] = useState('Consolidado dos parceiros')

  const getTotalMonth = (month: number) => {
    let total = 0
    budgets?.costCenters?.forEach((costCenter: any) => {
      costCenter?.categories?.forEach((category: any) => {
        total += Number(category?.months[month - 1]?.valueInCents)
      })
    })
    return total
  }

  const getTotalFromBudgetResults = () => {
    let total = 0
    
    if (isForMonth && budgets?.costCenters) {
      budgets.costCenters.forEach((costCenter: any) => {
        costCenter?.categories?.forEach((category: any) => {
          category?.months?.forEach((month: any) => {
            total += Number(month?.valueInCents || 0)
          })
        })
      })
    }
    else if (budgets?.items) {
      budgets.items.forEach((item: any) => {
        total += Number(item?.valueInCents || 0)
      })
    }
    
    return total
  }

  useEffect(() => {
    const headCellsTemp = [
      {
        id: 'category',
        align: 'left',
        label: 'CENTROS DE CUSTO',
        value: getTotalFromBudgetResults(),
      },
    ]

    if (isForMonth) {
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
    } else {
      setQntPage(budgets?.meta?.totalPages)

      budgets?.items?.forEach((item: any) => {
        if (item?.partnerMunicipality) {
          headCellsTemp?.push({
            id: item?.id,
            align: 'left',
            label: item?.partnerMunicipality?.name?.toUpperCase(),
            value: item?.valueInCents,
          })
        } else {
          headCellsTemp?.push({
            id: item?.id,
            align: 'left',
            label: item?.partnerState?.name?.toUpperCase(),
            value: item?.valueInCents,
          })
        }
      })
    }
    setHeadCells(headCellsTemp)
    setRows(budgets?.costCenters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets?.items, budgets?.meta?.totalPages, budgets?.costCenters, page])

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [qntPage, page])

  const handleChangePage = (direction: string) => {
    if (direction === 'prev') {
      setPage(page - 1)
      !isForMonth && changePage(page - 1)
    } else {
      setPage(page + 1)
      !isForMonth && changePage(page + 1)
    }
  }

  useEffect(() => {
    setPage(1)

    if (partnerState || partnerMunicipality) {
      setIsFilter(true)
      if (partnerMunicipality) {
        setTitle(partnerMunicipality.name + ' - ' + partnerMunicipality?.uf)
      } else if (partnerState) {
        setTitle(partnerState.name)
      }
    } else {
      setIsFilter(false)
      setTitle('Consolidado dos parceiros')
    }
  }, [partnerState, partnerMunicipality])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="px-4 py-7">
          <div className="text-xl font-bold">{isForMonth ? 'Consolidado por Mês' : title}</div>
        </div>
        <div className="flex items-center">
          {!isFilter && (
            <Fragment>
              <Button
                data-test="cost-center"
                variant="erpSecondary"
                className="mr-2"
                onClick={() => setModalOpenCostCentral(true)}
              >
                Centro de Custo
              </Button>
              <Button
                data-test="month"
                variant="erpSecondary"
                className={`rounded-r-none ${isForMonth && 'bg-[#BFEDFC]'}`}
                onClick={() => {
                  changeIsForMonth(1)
                  setPage(1)
                  changePage(1)
                }}
              >
                Por Mês
              </Button>
              <Button
                data-test="network"
                variant="erpSecondary"
                className={`rounded-l-none ${!isForMonth && 'bg-[#BFEDFC]'}`}
                onClick={() => {
                  changeIsForMonth(0)
                  setPage(1)
                  changePage(1)
                }}
              >
                Por Rede
              </Button>
            </Fragment>
          )}
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
          {isFilter && !shared && (
            <Fragment>
              <Button
                data-test="cost-center"
                variant="erpPrimary"
                className="ml-2"
                onClick={() =>
                  router.push(
                    `/planejamento/detalhes/${budgetPlan?.id}/orcamento/${
                      isForMonth ? budgets?.data?.budgetId : budgets?.items[0]?.id
                    }`,
                  )
                }
                disabled={isForMonth ? !budgets?.data?.budgetId : !budgets?.items[0]?.id}
              >
                Editar
              </Button>
            </Fragment>
          )}
        </div>
      </div>
      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{
            width: '100%',
          }}
        >
          {!budgets ? (
            <LoadingTable />
          ) : (
            <TableContainer className="w-full overflow-auto">
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                <EnhancedTableHead headCells={headCells} />
                <TableBody id="tableBody" className="">
                  {rows?.length ? (
                    rows.map((row: any) => {
                      return (
                        <BudgetPlanDetailTableRow
                          key={row?.id}
                          row={row}
                          headCells={headCells}
                          isForMonth={isForMonth}
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
      {shared ? (
        <ModalCostCenterShared
          open={modalOpenCostCentral}
          onClose={() => {
            setModalOpenCostCentral(false)
          }}
          budget={budgetPlan}
          program={program}
        />
      ) : (
        <ModalCostCenter
          open={modalOpenCostCentral}
          onClose={() => {
            setModalOpenCostCentral(false)
          }}
          budget={budgetPlan}
          program={program}
        />
      )}
    </div>
  )
}
