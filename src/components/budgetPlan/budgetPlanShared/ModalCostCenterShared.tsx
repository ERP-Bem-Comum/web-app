import { Button } from '@/components/ui/button'
import {
  Autocomplete,
  Box,
  Collapse,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Modal,
  Switch,
  TextField,
} from '@mui/material'
import {
  MdOutlineClose,
  MdOutlineExpandLess,
  MdOutlineExpandMore,
  MdOutlineHomeWork,
} from 'react-icons/md'
import { Fragment, useEffect, useState } from 'react'
import { IProgram } from '@/services/programs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetCostCenterByBudgetPlanShared } from '@/services/budgetPlanShared'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budget: any
  program: IProgram
}

export function ModalCostCenterShared({ open, onClose, budget, program }: Props) {
  const [selectedCostCenter, setSelectedCostCenter] = useState<any>(null)
  const [openCostCenter, setOpenCostCenter] = useState<number | null>()
  const [openSub, setOpenSub] = useState<number | null>()
  const [costCenterFilterList, setCostCenterFilterList] = useState([])

  const { data: dataAll, isLoading: isLoadingAll } = useGetCostCenterByBudgetPlanShared(budget?.id)

  useEffect(() => {
    if (dataAll?.costCenters && !selectedCostCenter) {
      setSelectedCostCenter(dataAll?.costCenters[0])
    }
  }, [dataAll])

  const handleClose = () => {
    setSelectedCostCenter(dataAll?.costCenters[0])
    onClose()
  }

  useEffect(() => {
    if (dataAll?.costCenters)
      setCostCenterFilterList(
        dataAll?.costCenters?.filter((c: any) => c.name === selectedCostCenter?.name),
      )
  }, [dataAll?.costCenters, selectedCostCenter])

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
            <div className="w-full">
              <Autocomplete
                id="costCenter"
                size="small"
                fullWidth
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
              {costCenterFilterList?.map((costCenter: any, index) => (
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
                    <div className="flex items-center h-full">
                      <div className="border-r border-[#D1D1D1] w-[50px] h-full flex items-center justify-center">
                        {openCostCenter === costCenter.id ? (
                          <MdOutlineExpandLess size={17} />
                        ) : (
                          <MdOutlineExpandMore size={17} />
                        )}
                      </div>
                      <ListItemText primary={costCenter?.name} sx={{ marginLeft: '16px' }} />
                    </div>
                    <div>
                      <FormControlLabel
                        onClick={(e) => e.stopPropagation()}
                        control={
                          <Switch
                            color="primary"
                            defaultChecked={costCenter?.active}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#155366',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#32C6F4',
                              },
                            }}
                          />
                        }
                        label={''}
                        sx={{ marginRight: '16px' }}
                        disabled={true}
                      />
                    </div>
                  </ListItemButton>
                  <Collapse in={openCostCenter === costCenter?.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {costCenter?.categories?.map((category: any, index2: number) => (
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
                            <div className="flex items-center h-full">
                              <div className="border-r border-[#D1D1D1] w-[50px] h-full flex items-center justify-center">
                                {openSub === category?.id ? (
                                  <MdOutlineExpandLess size={17} />
                                ) : (
                                  <MdOutlineExpandMore size={17} />
                                )}
                              </div>
                              <ListItemText primary={category?.name} sx={{ marginLeft: '16px' }} />
                            </div>
                            <div className="flex items-center">
                              <FormControlLabel
                                onClick={(e) => e.stopPropagation()}
                                control={
                                  <Switch
                                    color="primary"
                                    defaultChecked={category?.active}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#155366',
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#32C6F4',
                                      },
                                    }}
                                  />
                                }
                                label={''}
                                sx={{ marginRight: '16px' }}
                                onChange={(e) => {
                                  e.stopPropagation()
                                }}
                                disabled={true}
                              />
                            </div>
                          </ListItemButton>
                          <Collapse in={openSub === category?.id} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {category?.subCategories?.map((subCategory: any, index3: number) => (
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
                                    <div className="flex items-center h-full">
                                      <ListItemText
                                        primary={subCategory.name}
                                        sx={{ marginLeft: '16px' }}
                                      />
                                      {subCategory?.type === 'INSTITUCIONAL' && (
                                        <MdOutlineHomeWork size={18} className="ml-3" />
                                      )}
                                    </div>
                                  </ListItem>
                                </Fragment>
                              ))}
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
      </Box>
    </Modal>
  )
}
