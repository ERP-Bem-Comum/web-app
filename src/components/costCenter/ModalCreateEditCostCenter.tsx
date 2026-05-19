import { createCostCenter, editCostCenter } from '@/services/costCenter'
import { IEditCostCenter } from '@/types/costCenter'
import { CostCenterType } from '@/utils/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalBase } from './Base/ModalCreateEditBase'
import { useOptions } from '@/hooks/useOptions'

interface Props {
  open: boolean
  budgetPlanId: number
  costCenter: IEditCostCenter | null
  onClose: () => void
}

const CostCenterSchema = z.object({
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
  budgetPlanId: z.number({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Campo Obrigatório',
  }),
})
// extracting the type
type CostCenter = z.infer<typeof CostCenterSchema>

export function ModalCreateEditCostCenter({ open, budgetPlanId, costCenter, onClose }: Props) {
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
  } = useForm<CostCenter>({
    defaultValues: {
      budgetPlanId,
    },
    resolver: zodResolver(CostCenterSchema),
  })

  useEffect(() => {
    setValue('name', costCenter?.name ?? '')
    setValue('type', costCenter?.type ?? '')
  }, [costCenter, setValue, open])

  const onSubmit: SubmitHandler<CostCenter> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    const info = {
      ...data,
    }

    let response
    try {
      costCenter
        ? (response = await editCostCenter(info, costCenter?.id))
        : (response = await createCostCenter(info))
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
    <ModalBase<CostCenter>
      open={open}
      onClose={handleClose}
      title="Centro de custo"
      onSubmit={onSubmit}
      control={control}
      edit={!!costCenter}
      errorMessage={errorMessage}
      success={success}
      isDisabled={isDisabled}
      setShowModalConfirm={setShowModalConfirm}
      showModalConfirm={showModalConfirm}
    >
      <div className="w-full">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              id="name"
              sx={{ marginBottom: 2 }}
              label="Nome do centro de custo"
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
              noOptionsText="Tipo do centro de custo"
              options={Object.keys(CostCenterType)}
              getOptionLabel={(option) => CostCenterType[option]}
              onChange={(_event, newValue) => {
                field.onChange(newValue)
                // setSelectedProgram(newValue)
              }}
              sx={{ marginBottom: '21px' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo do centro de custo"
                  error={!!errors.type}
                  helperText={errors.type ? errors.type?.message : ''}
                />
              )}
              value={field.value === '' ? null : field.value}
            />
          )}
        />
      </div>
    </ModalBase>
  )
}
