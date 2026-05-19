import { createCostCenterSubCategory, editCostCenterSubCategory } from '@/services/costCenter'
import { IEditCostCenterSubCategory } from '@/types/subCategory'
import { costCenterSubCatOption, SubCategoryReleaseType } from '@/utils/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalBase } from '../Base/ModalCreateEditBase'
import { useOptions } from '@/hooks/useOptions'

interface Props {
  open: boolean
  categoryId: number
  subCategory: IEditCostCenterSubCategory | null
  onClose: () => void
}

const SubCategorySchema = z.object({
  name: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  type: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  releaseType: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  costCenterCategoryId: z.number({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Campo Obrigatório',
  }),
})
// extracting the type
type SubCategory = z.infer<typeof SubCategorySchema>

export function ModalCreateEditSubCategory({ open, categoryId, subCategory, onClose }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { refetch } = useOptions()

  const {
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SubCategory>({
    defaultValues: {
      name: subCategory?.name,
      type: subCategory?.type,
      costCenterCategoryId: categoryId,
      releaseType: subCategory?.releaseType,
    },
    resolver: zodResolver(SubCategorySchema),
  })

  useEffect(() => {
    setValue('name', subCategory?.name ?? '')
    setValue('type', subCategory?.type ?? '')
    setValue('releaseType', subCategory?.releaseType ?? '')
  }, [subCategory, categoryId, setValue, open])

  const onSubmit: SubmitHandler<SubCategory> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    const info = {
      ...data,
      costCenterCategoryId: categoryId,
    }

    let response
    try {
      subCategory
        ? (response = await editCostCenterSubCategory(subCategory?.id, info))
        : (response = await createCostCenterSubCategory(info))
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
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
      queryClient.invalidateQueries({
        queryKey: ['cost_center_by_budget_plan'],
      })
      queryClient.invalidateQueries({
        queryKey: ['cost-center-active-by-budget-plan'],
      })
      refetch.refetchCostCenterAndNested()
    }

    setShowModalConfirm(true)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <ModalBase<SubCategory>
      open={open}
      onClose={handleClose}
      title="Sub categoria"
      onSubmit={onSubmit}
      control={control}
      edit={!!subCategory}
      errorMessage={errorMessage}
      success={success}
      isDisabled={isDisabled}
      setShowModalConfirm={setShowModalConfirm}
      showModalConfirm={showModalConfirm}
    >
      <div className="w-full" onClick={(e) => e.stopPropagation()}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              id="name"
              sx={{ marginBottom: 2 }}
              label="Nome da sub-categoria"
              error={!!errors.name}
              size="small"
              helperText={errors.name ? errors.name?.message : ''}
              fullWidth
            />
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              fullWidth
              id="type"
              size="small"
              noOptionsText="Tipo"
              options={Object.keys(costCenterSubCatOption)}
              getOptionLabel={(option) => costCenterSubCatOption[option] ?? ''}
              onChange={(_event, newValue) => {
                field.onChange(newValue)
                // setSelectedProgram(newValue)
              }}
              sx={{ marginBottom: '21px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo"
                  error={!!errors.type}
                  helperText={errors.type ? errors.type?.message : ''}
                />
              )}
            />
          )}
        />
        <Controller
          name="releaseType"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              fullWidth
              id="type"
              size="small"
              noOptionsText="Tipo de lançamento"
              options={Object.keys(SubCategoryReleaseType)}
              getOptionLabel={(option) => SubCategoryReleaseType[option] ?? ''}
              onChange={(_event, newValue) => {
                field.onChange(newValue)
                // setSelectedProgram(newValue)
              }}
              sx={{ marginBottom: '21px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de lançamento"
                  error={!!errors.releaseType}
                  helperText={errors.releaseType ? errors.releaseType?.message : ''}
                />
              )}
            />
          )}
        />
      </div>
    </ModalBase>
  )
}
