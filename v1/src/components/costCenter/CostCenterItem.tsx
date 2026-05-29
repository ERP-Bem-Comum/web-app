import { Button } from '@/components/ui/button'
import { IBudget } from '@/services/budget'
import { toggleActiveCostCenter } from '@/services/costCenter'
import { IEditCostCenter } from '@/types/costCenter'
import { FormControlLabel, FormLabel, ListItemText, Switch } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Fragment, useState } from 'react'
import {
  MdAdd,
  MdOutlineExpandLess,
  MdOutlineExpandMore,
  MdOutlineModeEditOutline,
} from 'react-icons/md'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalCreateEditCategory } from './Category/ModalCreateEditCategory'
import { ModalCreateEditCostCenter } from './ModalCreateEditCostCenter'
import { useOptions } from '@/hooks/useOptions'

interface CostCenterProps {
  budget: IBudget
  costCenter: IEditCostCenter
  getDisabled: (active?: boolean) => boolean
  openCostCenter: number | null
}

export const CostCenterItem = ({
  costCenter,
  openCostCenter,
  budget,
  getDisabled,
}: CostCenterProps) => {
  const [isDisabled, setIsDisabled] = useState(false)
  const [isError, setIsError] = useState(false)
  const [showModalEditCostCenter, setShowModalEditCostCenter] = useState(false)
  const [showModalCreateCategory, setShowModalCreateCategory] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { refetch } = useOptions()

  const handleToggleActiveCostCenter = async (id: number) => {
    setIsDisabled(true)

    let response
    try {
      response = await toggleActiveCostCenter(id)

      if (response?.message) {
        setIsError(true)
        setErrorMessage(response.message)
      } else {
        setIsError(false)
      }

      queryClient.invalidateQueries({
        queryKey: ['cost_center_by_budget_plan'],
      })
      refetch.refetchCostCenterAndNested()
    } catch (error: unknown) {
      console.error(error)
      throw error
    } finally {
      setIsDisabled(false)
    }
  }

  return (
    <Fragment>
      <div className="flex items-center h-full">
        <div className="border-r border-[#D1D1D1] w-[50px] h-full flex items-center justify-center">
          {openCostCenter === costCenter.id ? (
            <MdOutlineExpandLess size={17} />
          ) : (
            <MdOutlineExpandMore size={17} />
          )}
        </div>
        <ListItemText
          primary={`${costCenter?.name} - ${costCenter.type}`}
          sx={{ marginLeft: '16px' }}
        />
      </div>
      <div className="flex items-center">
        <Button
          data-test="edit-sub-category"
          variant="ghost"
          className="mr-1 text-erp-button-secondary-textNormal"
          onClick={(e) => {
            setShowModalCreateCategory(true)
            e.stopPropagation()
          }}
          disabled={getDisabled(costCenter.active) || isDisabled}
        >
          <MdAdd size={16} className="mr-1" /> Categoria
        </Button>
        <Button
          data-test="edit-sub-category"
          variant="ghost"
          className="mr-1 text-erp-button-secondary-textNormal"
          onClick={(e) => {
            setShowModalEditCostCenter(true)
            e.stopPropagation()
          }}
          disabled={getDisabled(costCenter.active) || isDisabled}
        >
          <MdOutlineModeEditOutline size={16} className="mr-1" /> Editar
        </Button>
        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          control={
            <Switch
              color="primary"
              checked={costCenter?.active}
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
          label={<FormLabel>{costCenter.active ? 'Desativar' : 'Ativar'}</FormLabel>}
          sx={{ marginRight: '16px' }}
          onChange={() => {
            handleToggleActiveCostCenter(costCenter?.id)
          }}
          disabled={getDisabled() || isDisabled}
        />
      </div>
      <ModalCreateEditCostCenter
        open={showModalEditCostCenter}
        onClose={() => {
          setShowModalEditCostCenter(false)
        }}
        costCenter={costCenter}
        budgetPlanId={budget.id}
      />
      <ModalCreateEditCategory
        open={showModalCreateCategory}
        onClose={() => {
          setShowModalCreateCategory(false)
        }}
        category={null}
        costCenterId={costCenter.id}
      />
      <ModalConfirm
        open={isError}
        onClose={() => {
          setIsError(false)
        }}
        text={errorMessage}
      />
    </Fragment>
  )
}
