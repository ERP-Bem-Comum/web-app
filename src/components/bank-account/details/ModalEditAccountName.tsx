import { zodResolver } from '@hookform/resolvers/zod'
import { TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalBase } from '../../costCenter/Base/ModalCreateEditBase'
import { useOptions } from '@/hooks/useOptions'
import { queryClient } from 'lib/react-query'
import { editAccountName } from '@/services/bankDetails'

interface Props {
  open: boolean
  account: {
    id: number
    name: string
  }
  onClose: () => void
}

const AccountSchema = z.object({
  name: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Account = z.infer<typeof AccountSchema>

export function ModalEditAccountName({ open, account, onClose }: Props) {
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
  } = useForm<Account>({
    defaultValues: {
      name: account?.name,
    },
    resolver: zodResolver(AccountSchema),
  })

  useEffect(() => {
    setValue('name', account?.name ?? '')
  }, [account, setValue, open])

  const onSubmit: SubmitHandler<Account> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      response = await editAccountName(account.id, data.name)
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

      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] })
      queryClient.invalidateQueries({ queryKey: ['BankDetail', account.id] })
    }

    setShowModalConfirm(true)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <ModalBase<Account>
      open={open}
      onClose={handleClose}
      title="Conta"
      onSubmit={onSubmit}
      control={control}
      edit={true}
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
              label="Nome da conta"
              error={!!errors.name}
              size="small"
              helperText={errors.name ? errors.name?.message : ''}
              fullWidth
            />
          )}
        />
      </div>
    </ModalBase>
  )
}
