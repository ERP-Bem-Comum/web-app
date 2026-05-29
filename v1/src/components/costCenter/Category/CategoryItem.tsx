import { Button } from '@/components/ui/button'
import { toggleActiveCostCenterCategory } from '@/services/costCenter'
import { IEditCostCenterCategory } from '@/types/category'
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
import { ModalConfirm } from '../../modals/ModalConfirm'
import { ModalCreateEditSubCategory } from '../SubCategory/ModalCreateEditSubCategory'
import { ModalCreateEditCategory } from './ModalCreateEditCategory'
import { useOptions } from '@/hooks/useOptions'

interface CategoryItemProps {
  category: IEditCostCenterCategory
  costCenter: IEditCostCenter
  getDisabled: (active?: boolean) => boolean
  openCategory: number | null
}

export const CategoryItem = ({
  category,
  costCenter,
  openCategory,
  getDisabled,
}: CategoryItemProps) => {
  const [isDisabled, setIsDisabled] = useState(false)
  const [isError, setIsError] = useState(false)
  const [showModalEditCategory, setShowModalEditCategory] = useState(false)
  const [showModalCreateSubCategory, setShowModalCreateSubCategory] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { refetch } = useOptions()

  const handleToggleActiveCategories = async (id: number) => {
    setIsDisabled(true)

    let response
    try {
      response = await toggleActiveCostCenterCategory(id)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setIsError(true)
      setErrorMessage(response.message)
    } else {
      setIsError(false)

      queryClient.invalidateQueries({
        queryKey: ['cost_center_by_budget_plan'],
      })

      refetch.refetchCostCenterAndNested()
    }
  }

  return (
    <Fragment>
      <div className="flex items-center h-full">
        <div className="border-r border-[#D1D1D1] w-[50px] h-full flex items-center justify-center">
          {openCategory === category?.id ? (
            <MdOutlineExpandLess size={17} />
          ) : (
            <MdOutlineExpandMore size={17} />
          )}
        </div>
        <ListItemText primary={category?.name} sx={{ marginLeft: '16px' }} />
      </div>
      <div className="flex items-center">
        <Button
          data-test="edit-sub-category"
          variant="ghost"
          className="mr-1 text-erp-button-secondary-textNormal"
          onClick={(e) => {
            setShowModalCreateSubCategory(true)
            e.stopPropagation()
          }}
          disabled={getDisabled(category.active) || isDisabled}
        >
          <MdAdd size={16} className="mr-1" /> Sub-categoria
        </Button>

        <Button
          data-test="edit-sub-category"
          variant="ghost"
          className="mr-1 text-erp-button-secondary-textNormal"
          onClick={(e) => {
            setShowModalEditCategory(true)
            e.stopPropagation()
          }}
          disabled={getDisabled(category.active) || isDisabled}
        >
          <MdOutlineModeEditOutline size={16} className="mr-1" /> Editar
        </Button>
        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          control={
            <Switch
              color="primary"
              checked={category.active}
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
          label={<FormLabel>{category?.active ? 'Desativar' : 'Ativar'}</FormLabel>}
          sx={{ marginRight: '16px' }}
          onChange={(e) => {
            handleToggleActiveCategories(category?.id)
            e.stopPropagation()
          }}
          disabled={getDisabled(costCenter.active) || isDisabled}
        />
      </div>
      <ModalCreateEditCategory
        open={showModalEditCategory}
        onClose={() => {
          setShowModalEditCategory(false)
        }}
        category={category}
        costCenterId={costCenter.id}
      />
      <ModalCreateEditSubCategory
        open={showModalCreateSubCategory}
        onClose={() => {
          setShowModalCreateSubCategory(false)
        }}
        categoryId={category.id}
        subCategory={null}
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
