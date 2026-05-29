'use client'
import { ICreateBudgetResult, IResult, createBudgetResult } from '@/services/budget'
import { ICostCenterCategory } from '@/types/category'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { formatCentsToCurrency } from '@/utils/formatCurrency'
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
import { useEffect, useState } from 'react'
import { MdOutlineArrowLeft, MdOutlineArrowRight } from 'react-icons/md'
import { ModalCalculationMemory } from '../../calculationMemory/ModalCalculationMemory'
import { LoadingTable } from '../../table/loadingTable'
import TableHeadCellBudgetStyled from '../../table/TableHeadCellBudgetStyled'
import { Button } from '../../ui/button'
import BudgetTableRow from './BudgetTableRow'

interface Props {
  budget: any
  costCenter: any
  budgetPlanName: string
  allCostCenters: any[]
  status: string
  programName: string
}

interface HeadCell {
  id: string
  label: string
  align: any
}

interface EnhancedTableProps {
  headCells: HeadCell[]
  page: number
}

const headCells: HeadCell[] = [
  {
    id: '1',
    align: 'left',
    label: 'JANEIRO',
  },
  {
    id: '2',
    align: 'left',
    label: 'FEVEREIRO',
  },
  {
    id: '3',
    align: 'left',
    label: 'MARÇO',
  },
  {
    id: '4',
    align: 'left',
    label: 'ABRIL',
  },
  {
    id: '5',
    align: 'left',
    label: 'MAIO',
  },
  {
    id: '6',
    align: 'left',
    label: 'JUNHO',
  },
  {
    id: '7',
    align: 'left',
    label: 'JULHO',
  },
  {
    id: '8',
    align: 'left',
    label: 'AGOSTO',
  },
  {
    id: '9',
    align: 'left',
    label: 'SETEMBRO',
  },
  {
    id: '10',
    align: 'left',
    label: 'OUTUBRO',
  },
  {
    id: '11',
    align: 'left',
    label: 'NOVEMBRO',
  },
  {
    id: '12',
    align: 'left',
    label: 'DEZEMBRO',
  },
]

function EnhancedTableHead(props: EnhancedTableProps) {
  const { headCells, page } = props
  let headCellSplit
  page === 1 ? (headCellSplit = headCells.slice(0, 6)) : (headCellSplit = headCells.slice(6, 12))

  return (
    <TableHead>
      <TableRow>
        <TableHeadCellBudgetStyled key={'categories'} align={'left'} backgroundColor={'#76D9F8'}>
          <div className="font-semibold text-sm">CATEGORIAS</div>
        </TableHeadCellBudgetStyled>
        {headCellSplit?.map((headCell) => (
          <TableHeadCellBudgetStyled
            key={headCell.id}
            align={headCell.align}
            backgroundColor={'#BFEDFC'}
          >
            <div className="font-semibold text-sm">{headCell.label}</div>
          </TableHeadCellBudgetStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}

interface FooterProps {
  headCells: HeadCell[]
  values: number[]
  page: number
}

function EnhancedTableFooter({ headCells, values, page }: FooterProps) {
  let headCellSplit
  page === 1 ? (headCellSplit = headCells.slice(0, 6)) : (headCellSplit = headCells.slice(6, 12))

  return (
    <TableFooter>
      <TableRow>
        <TableHeadCellBudgetStyled key={'categories'} align={'left'} backgroundColor={'#76D9F8'}>
          <div className="font-semibold text-sm">
            {formatCentsToCurrency(values[0])}
          </div>
        </TableHeadCellBudgetStyled>
        {headCellSplit?.map((headCell, index) => (
          <TableHeadCellBudgetStyled
            key={headCell.id}
            align={headCell.align}
            backgroundColor={headCell?.id === 'categories' ? '#76D9F8' : '#BFEDFC'}
          >
            <div className="font-semibold text-sm">
              {formatCentsToCurrency(values[Number(headCell?.id)])}
            </div>
          </TableHeadCellBudgetStyled>
        ))}
      </TableRow>
    </TableFooter>
  )
}

export default function BudgetTable({
  budget,
  costCenter,
  budgetPlanName,
  allCostCenters,
  status,
  programName,
}: Props) {
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [rows, setRows] = useState<any>([])
  const [footerValues, setFooterValues] = useState<number[]>([])
  const [modalShowCalculation, setModalShowCalculation] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ICostCenterCategory | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<ICostCenterSubCategory | null>(
    null,
  )

  useEffect(() => {
    const list = [] as number[]

    for (let i = 0; i < 13; i++) {
      list.push(0)
    }

    setRows(costCenter?.categories)
    setQntPage(2)

    budget?.budgetResults?.forEach((result: IResult) => {
      if (
        costCenter?.categories?.find(
          (category: any) => category?.id === result?.costCenterCategoryId,
        )
      ) {
        list[0] += Number(result.valueInCents || 0)
        list[result?.month] += Number(result.valueInCents || 0)
      }
    })

    setFooterValues(list)
  }, [budget, costCenter, budgetPlanName])

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

  const handleResult = async () => {
    const resp = await createBudgetResult({
      budgetId: budget?.id,
      budgetResults: [
        {
          costCenterSubCategoryId: 1112,
          month: 1,
          valueInCents: 5000,
        },
      ],
    } as ICreateBudgetResult)
  }

  const filterCategory = (categoryId: number) => {
    return budget.budgetResults.filter(
      (result: IResult) => result?.costCenterCategoryId === categoryId,
    )
  }

  return (
    <div>
      <div className="px-4 py-7 flex justify-between items-center">
        <div className="text-xl font-bold">{costCenter?.name}</div>
        <div className="flex items-center">
          <Button
            data-test="previous"
            variant="erpSecondary"
            size="icon"
            className="mr-2"
            onClick={() => handleChangePage('prev')}
            disabled={disablePrev}
          >
            <MdOutlineArrowLeft size={24} />
          </Button>
          <Button
            data-test="next"
            variant="erpSecondary"
            size="icon"
            className="mr-2"
            onClick={() => handleChangePage('next')}
            disabled={disableNext}
          >
            <MdOutlineArrowRight size={24} />
          </Button>
          <Button
            data-test="calculate"
            variant="erpPrimary"
            onClick={() => setModalShowCalculation(true)}
          >
            Calcular Gasto
          </Button>
        </div>
      </div>
      <Box sx={{ width: '100%' }}>
        <Paper
          sx={{
            width: '100%',
          }}
        >
          {!budget ? (
            <LoadingTable />
          ) : (
            <TableContainer className="w-full overflow-auto">
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                <EnhancedTableHead headCells={headCells} page={page} />
                <TableBody id="tableBody" className="">
                  {rows?.length ? (
                    rows.map((row: any) => {
                      return (
                        <BudgetTableRow
                          key={row?.id}
                          row={row}
                          budgetResults={filterCategory(row?.id)}
                          page={page}
                          changeSelectedCategory={setSelectedCategory}
                          changeSelectedSubCategory={setSelectedSubCategory}
                          changeModalShowCalculation={setModalShowCalculation}
                        />
                      )
                    })
                  ) : (
                    <div className="p-4 text-erp-grayscale text-sm">
                      Nenhum resultado encontrado
                    </div>
                  )}
                </TableBody>
                <EnhancedTableFooter headCells={headCells} values={footerValues} page={page} />
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
      <ModalCalculationMemory
        open={modalShowCalculation}
        onClose={() => setModalShowCalculation(false)}
        budget={budget}
        budgetPlanName={budgetPlanName}
        costCenter={allCostCenters}
        startCostCenter={costCenter}
        startCategory={selectedCategory}
        startSubCategory={selectedSubCategory}
        status={status}
        programName={programName}
      />
    </div>
  )
}
