/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from '@/components/ui/button'
import { useGetCostCenterByBudgetPlan } from '@/services/costCenter'
import { IProgram } from '@/services/programs'
import { IBudgetPlan } from '@/types/budgetPlan'
import { ICostCenterCategory } from '@/types/category'
import { ICostCenter } from '@/types/costCenter'
import { ICostCenterSubCategory } from '@/types/subCategory'
import {
  Autocomplete,
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  Modal,
  TextField,
} from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Fragment, useEffect, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { Card, CardContent, CardHeader } from '../ui/card'
import { CategoryItem } from './Category/CategoryItem'
import { CostCenterItem } from './CostCenterItem'
import { ModalCreateEditCostCenter } from './ModalCreateEditCostCenter'
import { SubCategoryItem } from './SubCategory/SubCategoryItem'

interface Props {
  open: boolean
  onClose: () => void
  budget: IBudgetPlan
  program: IProgram
}

export function ModalCostCenter({ open, onClose, budget, program }: Props) {
  const [showModalCreateCostCenter, setShowModalCreateCostCenter] = useState(false)
  const [selectedCostCenter, setSelectedCostCenter] = useState<ICostCenter | undefined>(undefined)
  const [openCostCenter, setOpenCostCenter] = useState<number | null>(null)
  const [openSub, setOpenSub] = useState<number | null>(null)
  const [costCenterFilterList, setCostCenterFilterList] = useState([])

  const { data: dataAll } = useGetCostCenterByBudgetPlan(budget?.id)

  useEffect(() => {
    if (dataAll?.costCenters && !selectedCostCenter) {
      setSelectedCostCenter(dataAll?.costCenters[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataAll])

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
    queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
    queryClient.invalidateQueries({
      queryKey: ['cost-center-active-by-budget-plan'],
    })

    setSelectedCostCenter(dataAll?.costCenters[0])
    onClose()
  }

  useEffect(() => {
    if (dataAll?.costCenters)
      setCostCenterFilterList(
        dataAll?.costCenters?.filter((c: ICostCenter) => c.name === selectedCostCenter?.name),
      )
  }, [dataAll?.costCenters, selectedCostCenter])

  const getDisabled = (active = true) => {
    if (!active) {
      return true
    }
    if (budget?.status === 'APROVADO') {
      return true
    }
    return false
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`w-screen h-screen bg-erp-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6`}
      >
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Centros de Custo - {program?.name}</div>
          <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
            <MdOutlineClose size={32} color={'#155366'} />
          </Button>
        </div>
        <Card className="w-full mt-6 p-4">
          <CardHeader className="border-b border-erp-neutrals mb-5 px-0 pt-0">
            <div className="text-sm mb-7">
              Gerenciar os centros de custos, categorias e produtos/serviços:
            </div>
            <div className="w-full flex justify-start">
              <Autocomplete
                id="costCenter"
                size="small"
                className="w-3/5"
                noOptionsText="Centro de Custo"
                value={selectedCostCenter}
                options={dataAll?.costCenters}
                disableClearable
                getOptionLabel={(option) => option?.name}
                onChange={(_event, newValue) => {
                  setSelectedCostCenter(newValue)
                }}
                renderInput={(params) => <TextField {...params} label="Centro de Custo" />}
                sx={{
                  backgroundColor: '#fff',
                  marginRight: '16px',
                }}
              />
              <Button
                data-test="new-cost-center"
                variant="erpSecondary"
                className="mr-2 w-max text-sm min-w-max border border-[#248DAD] text-[#155366] font-bold"
                onClick={(e) => {
                  setShowModalCreateCostCenter(true)
                  e.stopPropagation()
                }}
              >
                Adicionar centro de custo
              </Button>
            </div>
          </CardHeader>
          <CardContent className=" px-0 w-full overflow-auto">
            <List
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                overflowY: 'auto',
                maxHeight: '450px',
                paddingRight: '5px',
              }}
              component="nav"
              aria-labelledby="nested-list-subheader"
            >
              {costCenterFilterList?.map((costCenter: ICostCenter, index) => (
                <Fragment key={'cost' + index}>
                  <ListItemButton
                    sx={{
                      backgroundColor: '#76D9F8',
                      height: 50,
                      padding: 0,
                      marginTop: '3px',
                      borderRadius: '5px',
                      justifyContent: 'space-between',
                    }}
                    key={costCenter?.id}
                    onClick={() =>
                      setOpenCostCenter(openCostCenter !== costCenter.id ? costCenter.id : null)
                    }
                  >
                    <CostCenterItem
                      costCenter={costCenter}
                      budget={budget}
                      getDisabled={getDisabled}
                      openCostCenter={openCostCenter}
                    />
                  </ListItemButton>

                  <Collapse in={openCostCenter === costCenter?.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {costCenter?.categories?.map((category: ICostCenterCategory, index2) => (
                        <Fragment key={'cost2' + index2}>
                          <ListItemButton
                            sx={{
                              backgroundColor: '#BFEDFC',
                              height: 50,
                              padding: 0,
                              marginLeft: '50px',
                              marginTop: '3px',
                              borderRadius: '5px',
                              justifyContent: 'space-between',
                            }}
                            key={category?.id}
                            onClick={() =>
                              setOpenSub(category?.id !== openSub ? category?.id : null)
                            }
                          >
                            <CategoryItem
                              category={category}
                              costCenter={costCenter}
                              openCategory={openSub}
                              getDisabled={getDisabled}
                            />
                          </ListItemButton>
                          <Collapse in={openSub === category?.id} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {category?.subCategories?.map(
                                (subCategory: ICostCenterSubCategory, index3) => (
                                  <Fragment key={'sub' + index3}>
                                    <ListItem
                                      sx={{
                                        backgroundColor: '#EBF9FE',
                                        height: 50,
                                        padding: 0,
                                        marginLeft: '100px',
                                        marginTop: '3px',
                                        borderRadius: '5px',
                                        justifyContent: 'space-between',
                                        width: 'auto',
                                      }}
                                    >
                                      <SubCategoryItem
                                        subCategory={subCategory}
                                        category={category}
                                        getDisabled={getDisabled}
                                      />
                                    </ListItem>
                                  </Fragment>
                                ),
                              )}
                            </List>
                          </Collapse>
                        </Fragment>
                      ))}
                    </List>
                  </Collapse>
                </Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
        {budget && (
          <ModalCreateEditCostCenter
            open={showModalCreateCostCenter}
            onClose={() => {
              setShowModalCreateCostCenter(false)
            }}
            costCenter={null}
            budgetPlanId={budget.id}
          />
        )}
      </Box>
    </Modal>
  )
}
