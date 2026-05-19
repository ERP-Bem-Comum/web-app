import { createCostCenterCategory, editCostCenterCategory } from '@/services/costCenter'
import { IEditCostCenterCategory } from '@/types/category'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalBase } from '../Base/ModalCreateEditBase'
import { useOptions } from '@/hooks/useOptions'

interface Props {
  open: boolean
  costCenterId: number
  category: IEditCostCenterCategory | null
  onClose: () => void
}

const CategorySchema = z.object({
  name: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  costCenterId: z.number({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Campo Obrigatório',
  }),
})
// extracting the type
type Category = z.infer<typeof CategorySchema>

export function ModalCreateEditCategory({ open, costCenterId, category, onClose }: Props) {
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
  } = useForm<Category>({
    defaultValues: {
      name: category?.name,
      costCenterId,
    },
    resolver: zodResolver(CategorySchema),
  })

  useEffect(() => {
    setValue('name', category?.name ?? '')
  }, [category, costCenterId, setValue, open])

  const onSubmit: SubmitHandler<Category> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    const info = {
      ...data,
    }

    let response
    try {
      category
        ? (response = await editCostCenterCategory(info, category?.id))
        : (response = await createCostCenterCategory(info))
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.data.message) {
      setSuccess(false)
      setErrorMessage(response.data.message)
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
    <ModalBase<Category>
      open={open}
      onClose={handleClose}
      title="Categoria"
      onSubmit={onSubmit}
      control={control}
      edit={!!category}
      errorMessage={errorMessage}
      success={success}
      isDisabled={isDisabled}
      setShowModalConfirm={setShowModalConfirm}
      showModalConfirm={showModalConfirm}
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            id="name"
            sx={{ marginBottom: 2 }}
            label="Nome da categoria"
            error={!!errors.name}
            size="small"
            helperText={errors.name ? errors.name?.message : ''}
            fullWidth
          />
        )}
      />
    </ModalBase>
  )
}
