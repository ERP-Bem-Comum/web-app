import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { Button } from '@/components/ui/button'
import { toggleActiveCostCenterSubCategory } from '@/services/costCenter'
import { IEditCostCenterCategory } from '@/types/category'
import { IEditCostCenterSubCategory } from '@/types/subCategory'
import { FormControlLabel, FormLabel, ListItemText, Switch } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Fragment, useState } from 'react'
import { MdOutlineHomeWork, MdOutlineModeEditOutline } from 'react-icons/md'
import { ModalCreateEditSubCategory } from './ModalCreateEditSubCategory'
import { useOptions } from '@/hooks/useOptions'

interface SubCategoryItemProps {
  subCategory: IEditCostCenterSubCategory
  category: IEditCostCenterCategory
  getDisabled: (active?: boolean) => boolean
}

export const SubCategoryItem = ({ subCategory, category, getDisabled }: SubCategoryItemProps) => {
  const [isDisabled, setIsDisabled] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalEditSubCategory, setShowModalEditSubCategory] = useState(false)

  const { refetch } = useOptions()

  const handleToggleActiveSubcategories = async (id: number) => {
    setIsDisabled(true)

    let response
    try {
      response = await toggleActiveCostCenterSubCategory(id)
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
        <ListItemText primary={subCategory.name} sx={{ marginLeft: '16px' }} />
        {subCategory?.type === 'INSTITUCIONAL' && <MdOutlineHomeWork size={18} className="ml-3" />}
      </div>

      <div className="flex items-center">
        <Button
          data-test="edit-sub-category"
          variant="ghost"
          className="mr-1 text-erp-button-secondary-textNormal"
          onClick={(e) => {
            setShowModalEditSubCategory(true)
            e.stopPropagation()
          }}
          disabled={getDisabled(subCategory?.active) || isDisabled}
        >
          <MdOutlineModeEditOutline size={16} className="mr-1" /> Editar
        </Button>

        <FormControlLabel
          onClick={(e) => e.stopPropagation()}
          control={
            <Switch
              color="primary"
              checked={subCategory?.active}
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
          label={<FormLabel>{subCategory.active ? 'Desativar' : 'Ativar'}</FormLabel>}
          sx={{ marginRight: '16px' }}
          onChange={(e) => {
            handleToggleActiveSubcategories(subCategory?.id)
            e.stopPropagation()
          }}
          disabled={getDisabled(category?.active) || isDisabled}
        />
      </div>
      <ModalCreateEditSubCategory
        open={showModalEditSubCategory}
        onClose={() => {
          setShowModalEditSubCategory(false)
        }}
        categoryId={category.id}
        subCategory={subCategory}
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
